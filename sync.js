/* Sincronización con Supabase para Hábitos y Finanzas (mismo origen = misma sesión).
 * Sin dependencias: habla con GoTrue y PostgREST por fetch. Los datos siguen viviendo en localStorage;
 * la nube es una copia que se actualiza sola (último cambio gana, por documento completo).
 * Si config.js no tiene url/anonKey, todo esto queda apagado y no cambia nada.
 *
 * Estado honesto: cada app tiene su propio estado (ok / pending / error). El estado general es el peor
 * de los dos: nunca dice "sincronizado" si algún envío falló o quedó algo sin subir. Un cambio sin subir
 * queda marcado (dirty) en `<key>-sync` y sobrevive a recargar la página. Si falla, reintenta solo
 * (5 s, 15 s, 45 s… hasta 5 min) y además se puede reintentar a mano. */
(function () {
  'use strict';
  var CFG = window.SUPABASE_CONFIG || {};
  var ENABLED = !!(CFG.url && CFG.anonKey);
  var NOMBRES = { finanzas: 'Finanzas', habitos: 'Hábitos' };
  var KEYS = { finanzas: 'finanzas-v1', habitos: 'habitos-v1' };
  var SESSION_KEY = 'sb-session-v1';
  var MAX_BACKUPS = 3;
  var listeners = [], appliers = {}, timers = {}, running = {}, again = {};
  var apps = { finanzas: { state: 'idle', error: '' }, habitos: { state: 'idle', error: '' } };
  var retryTimer = null, retryAt = 0, retryN = 0, lastOk = 0;

  function dirty(app) { return !!getMeta(app).dirty; }
  function aggregate() {
    if (!ENABLED) return 'off';
    if (!getSession()) return 'out';
    var st = Object.keys(KEYS).map(function (a) { return apps[a].state; });
    if (st.indexOf('error') >= 0) return 'error';
    if (st.indexOf('pending') >= 0 || st.indexOf('idle') >= 0 || Object.keys(KEYS).some(dirty)) return 'pending'; // idle = todavía no se confirmó nada
    return 'ok';
  }
  function emit() { var i = info(); listeners.forEach(function (f) { try { f(i); } catch (e) {} }); }
  function info() {
    var s = getSession(), status = aggregate();
    var errs = Object.keys(KEYS).filter(function (a) { return apps[a].state === 'error'; })
      .map(function (a) { return NOMBRES[a] + ': ' + apps[a].error; });
    return {
      enabled: ENABLED, status: status, error: errs.join(' · '), email: s && s.user ? s.user.email : '',
      pendientes: Object.keys(KEYS).filter(dirty).map(function (a) { return NOMBRES[a]; }),
      retryAt: status === 'error' ? retryAt : 0, lastOk: lastOk
    };
  }
  function hash(t) { var h = 5381; for (var i = 0; i < t.length; i++) h = ((h << 5) + h + t.charCodeAt(i)) | 0; return String(h); }
  function metaKey(app) { return KEYS[app] + '-sync'; }
  function getMeta(app) { try { return JSON.parse(localStorage.getItem(metaKey(app))) || {}; } catch (e) { return {}; } }
  function setMeta(app, m) { try { localStorage.setItem(metaKey(app), JSON.stringify(m)); } catch (e) {} }
  function getSession() { try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch (e) { return null; } }
  function setSession(s) { try { if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s)); else localStorage.removeItem(SESSION_KEY); } catch (e) {} }

  /** Copias de seguridad: se guardan antes de pisar lo local con la nube. Quedan solo las últimas 3 por app. */
  function backups(key) {
    var r = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i), m = k && k.match(/^(.*)-backup-(\d+)$/);
        if (m && m[1] === key) r.push({ k: k, ts: Number(m[2]) });
      }
    } catch (e) {}
    return r.sort(function (a, b) { return b.ts - a.ts; });
  }
  function pruneBackups(key) {
    backups(key).slice(MAX_BACKUPS).forEach(function (b) { try { localStorage.removeItem(b.k); } catch (e) {} });
  }
  function backup(key, text) {
    try { localStorage.setItem(key + '-backup-' + Date.now(), text); } catch (e) {}
    pruneBackups(key);
  }
  Object.keys(KEYS).forEach(function (a) { pruneBackups(KEYS[a]); });

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
    if (r.status === 400 || r.status === 401) { setSession(null); emit(); return null; }
    if (!r.ok) throw new Error('sesión ' + r.status);
    s = toSession(await r.json()); setSession(s); return s.access_token;
  }
  function describe(e) {
    var m = String((e && e.message) || e);
    if (/^(push|pull|sesión) 5\d\d/.test(m)) return 'el servidor no respondió (' + m.split(' ')[1] + ')';
    if (/^(push|pull) 40[13]/.test(m)) return 'sin permiso (' + m.split(' ')[1] + ')';
    if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return 'sin conexión';
    return m;
  }

  async function login(email, password) {
    if (!ENABLED) return { error: 'Falta completar config.js' };
    try {
      var r = await api('/auth/v1/token?grant_type=password', { method: 'POST', body: JSON.stringify({ email: email, password: password }) });
      var j = await r.json();
      if (!r.ok) return { error: j.error_description || j.msg || 'No se pudo entrar' };
      setSession(toSession(j));
      await syncAll();
      return {};
    } catch (e) { return { error: 'Sin conexión' }; }
  }
  function logout() { setSession(null); clearTimeout(retryTimer); retryAt = 0; Object.keys(KEYS).forEach(function (a) { apps[a] = { state: 'idle', error: '' }; }); emit(); }

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
    // Solo acá se limpia "dirty": el envío llegó de verdad. Si el dato cambió mientras tanto, sigue pendiente.
    var now = localStorage.getItem(KEYS[app]);
    setMeta(app, { updatedAt: ts, syncedAt: Date.now(), hash: hash(text), dirty: now !== text });
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
    if (apps[app].state !== 'error') apps[app].state = 'pending';
    emit();
    clearTimeout(timers[app]);
    timers[app] = setTimeout(function () { syncApp(app); }, 1500);
  }

  async function syncApp(app) {
    if (!ENABLED || !getSession()) return;
    if (running[app]) { again[app] = true; return running[app]; }
    apps[app].state = 'pending'; emit();
    running[app] = (async function () {
      try {
        var key = KEYS[app], local = localStorage.getItem(key), m = getMeta(app);
        var remote = await pull(app);
        var firstLink = !m.syncedAt;
        if (!remote) {
          if (local && (!firstLink || window.confirm('Todavía no hay datos de ' + NOMBRES[app] + ' en la nube. ¿Subir los de este dispositivo?'))) await push(app, local, m.updatedAt || Date.now());
        } else {
          var rts = Date.parse(remote.updated_at), lts = m.updatedAt || 0;
          var usarNube = rts > lts; // último cambio gana; lo local se respalda antes de pisarlo
          if (firstLink && local && rts !== lts) {
            usarNube = window.confirm('Hay datos de ' + NOMBRES[app] + ' en la nube y también en este dispositivo.\n\nAceptar = usar los de la nube (se guarda una copia de los de acá).\nCancelar = subir los de este dispositivo y reemplazar la nube.');
          }
          if (usarNube) {
            if (local) backup(key, local);
            var text = JSON.stringify(remote.data);
            localStorage.setItem(key, text);
            setMeta(app, { updatedAt: rts, syncedAt: Date.now(), hash: hash(text), dirty: false });
            if (appliers[app]) appliers[app]();
          } else if (lts > rts || firstLink || m.dirty) {
            await push(app, local, m.updatedAt || Date.now());
          }
        }
        apps[app] = { state: dirty(app) ? 'pending' : 'ok', error: '' };
      } catch (e) {
        apps[app] = { state: 'error', error: describe(e) };
      }
    })();
    await running[app];
    running[app] = null;
    if (again[app]) { again[app] = false; return syncApp(app); }
    afterRound();
  }

  /** Después de cada intento: si algo falló, programa un reintento con espera creciente. */
  function afterRound() {
    var st = aggregate();
    clearTimeout(retryTimer);
    if (st === 'error') {
      var wait = Math.min(300, 5 * Math.pow(3, retryN)) * 1000;
      retryN++;
      retryAt = Date.now() + wait;
      retryTimer = setTimeout(syncAll, wait);
    } else {
      retryN = 0; retryAt = 0;
      if (st === 'ok') lastOk = Date.now();
    }
    emit();
  }
  function syncAll() { return Promise.all(Object.keys(KEYS).map(syncApp)); }
  /** Reintento a mano: arranca de cero la espera. */
  function retry() { retryN = 0; return syncAll(); }

  /** Cada app registra cómo recargar su estado en memoria cuando llega algo de la nube. */
  function register(app, onRemote) {
    appliers[app] = onRemote;
    if (ENABLED && getSession()) syncAll(); // las dos: así el estado general se basa en datos confirmados
  }

  if (ENABLED) {
    addEventListener('online', retry);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) syncAll(); });
  }
  window.Sync = {
    enabled: ENABLED, info: info, login: login, logout: logout, touch: touch, register: register,
    syncAll: syncAll, retry: retry, onStatus: function (f) { listeners.push(f); f(info()); }
  };
})();
