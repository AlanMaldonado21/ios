/* Sincronización con Supabase para Hábitos y Finanzas (mismo origen = misma sesión).
 * Sin dependencias: habla con GoTrue y PostgREST por fetch. Los datos siguen viviendo en localStorage;
 * la nube es una copia que se actualiza sola (último cambio gana, por documento completo).
 * Si config.js no tiene url/anonKey, todo esto queda apagado y no cambia nada. */
(function () {
  'use strict';
  var CFG = window.SUPABASE_CONFIG || {};
  var ENABLED = !!(CFG.url && CFG.anonKey);
  var NOMBRES = { finanzas: 'Finanzas', habitos: 'Hábitos' };
  var KEYS = { finanzas: 'finanzas-v1', habitos: 'habitos-v1' };
  var SESSION_KEY = 'sb-session-v1';
  var listeners = [], appliers = {}, timers = {}, status = ENABLED ? 'out' : 'off', lastError = '';

  function setStatus(s, err) { status = s; lastError = err || ''; listeners.forEach(function (f) { try { f(info()); } catch (e) {} }); }
  function info() { var s = getSession(); return { enabled: ENABLED, status: status, error: lastError, email: s && s.user ? s.user.email : '' }; }
  function hash(t) { var h = 5381; for (var i = 0; i < t.length; i++) h = ((h << 5) + h + t.charCodeAt(i)) | 0; return String(h); }
  function metaKey(app) { return KEYS[app] + '-sync'; }
  function getMeta(app) { try { return JSON.parse(localStorage.getItem(metaKey(app))) || {}; } catch (e) { return {}; } }
  function setMeta(app, m) { try { localStorage.setItem(metaKey(app), JSON.stringify(m)); } catch (e) {} }
  function getSession() { try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch (e) { return null; } }
  function setSession(s) { try { if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s)); else localStorage.removeItem(SESSION_KEY); } catch (e) {} }

  function api(path, opts, token) {
    opts = opts || {};
    var headers = Object.assign({ apikey: CFG.anonKey, 'Content-Type': 'application/json' }, opts.headers || {});
    if (token) headers.Authorization = 'Bearer ' + token;
    return fetch(CFG.url.replace(/\/$/, '') + path, Object.assign({}, opts, { headers: headers }));
  }
  function toSession(j) {
    return { access_token: j.access_token, refresh_token: j.refresh_token, expires_at: Math.floor(Date.now() / 1000) + (j.expires_in || 3600), user: { id: j.user.id, email: j.user.email } };
  }
  async function token() {
    var s = getSession();
    if (!s) return null;
    if (s.expires_at - 60 > Date.now() / 1000) return s.access_token;
    var r = await api('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: JSON.stringify({ refresh_token: s.refresh_token }) });
    if (!r.ok) { setSession(null); setStatus('out'); return null; }
    s = toSession(await r.json()); setSession(s); return s.access_token;
  }

  async function login(email, password) {
    if (!ENABLED) return { error: 'Falta completar config.js' };
    try {
      var r = await api('/auth/v1/token?grant_type=password', { method: 'POST', body: JSON.stringify({ email: email, password: password }) });
      var j = await r.json();
      if (!r.ok) return { error: j.error_description || j.msg || 'No se pudo entrar' };
      setSession(toSession(j)); setStatus('pending');
      await syncAll();
      return {};
    } catch (e) { return { error: 'Sin conexión' }; }
  }
  function logout() { setSession(null); setStatus(ENABLED ? 'out' : 'off'); }

  async function pull(app) {
    var t = await token(); if (!t) throw new Error('sin sesión');
    var r = await api('/rest/v1/app_state?app=eq.' + app + '&select=data,updated_at', {}, t);
    if (!r.ok) throw new Error('pull ' + r.status);
    var rows = await r.json();
    return rows[0] || null;
  }
  async function push(app, text, ts) {
    var t = await token(); if (!t) throw new Error('sin sesión');
    var s = getSession();
    var r = await api('/rest/v1/app_state?on_conflict=user_id,app', {
      method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ user_id: s.user.id, app: app, data: JSON.parse(text), updated_at: new Date(ts).toISOString() })
    }, t);
    if (!r.ok) throw new Error('push ' + r.status);
    setMeta(app, { updatedAt: ts, syncedAt: Date.now(), hash: hash(text) });
  }

  /** Avisa que el dato local cambió (solo si cambió de verdad). */
  function touch(app) {
    if (!ENABLED || !KEYS[app]) return;
    var text = localStorage.getItem(KEYS[app]);
    if (!text) return;
    var m = getMeta(app);
    if (m.hash === hash(text)) return;
    m.hash = hash(text); m.updatedAt = Date.now(); m.dirty = true; setMeta(app, m);
    if (!getSession()) return;
    setStatus('pending');
    clearTimeout(timers[app]);
    timers[app] = setTimeout(function () { syncApp(app); }, 1500);
  }

  async function syncApp(app) {
    if (!ENABLED || !getSession()) return;
    try {
      var key = KEYS[app], local = localStorage.getItem(key), m = getMeta(app);
      var remote = await pull(app);
      var firstLink = !m.syncedAt;
      if (!remote) {
        if (local && (!firstLink || window.confirm('Todavía no hay datos de ' + NOMBRES[app] + ' en la nube. ¿Subir los de este dispositivo?'))) await push(app, local, m.updatedAt || Date.now());
      } else {
        var rts = Date.parse(remote.updated_at), lts = m.updatedAt || 0;
        var usarNube = rts > lts;
        if (firstLink && local && rts !== lts) {
          usarNube = window.confirm('Hay datos de ' + NOMBRES[app] + ' en la nube y también en este dispositivo.\n\nAceptar = usar los de la nube (se guarda una copia de los de acá).\nCancelar = subir los de este dispositivo y reemplazar la nube.');
        }
        if (usarNube) {
          if (local) { try { localStorage.setItem(key + '-backup-' + Date.now(), local); } catch (e) {} }
          var text = JSON.stringify(remote.data);
          localStorage.setItem(key, text);
          setMeta(app, { updatedAt: rts, syncedAt: Date.now(), hash: hash(text) });
          if (appliers[app]) appliers[app]();
        } else if (lts > rts || firstLink) {
          await push(app, local, m.updatedAt || Date.now());
        }
      }
      setStatus('ok');
    } catch (e) { setStatus('error', String(e.message || e)); }
  }
  function syncAll() { return Promise.all(Object.keys(KEYS).map(syncApp)); }

  /** Cada app registra cómo recargar su estado en memoria cuando llega algo de la nube. */
  function register(app, onRemote) {
    appliers[app] = onRemote;
    if (ENABLED && getSession()) { setStatus('pending'); syncApp(app); }
  }

  if (ENABLED) {
    addEventListener('online', syncAll);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) syncAll(); });
  }
  window.Sync = { enabled: ENABLED, info: info, login: login, logout: logout, touch: touch, register: register, syncAll: syncAll, onStatus: function (f) { listeners.push(f); f(info()); } };
})();
