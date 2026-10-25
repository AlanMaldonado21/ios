/* Lógica compartida por Hábitos y Finanzas (sin dependencias, mismo origen = mismo localStorage).
 * Todo se DERIVA de los datos existentes (habitos-v1, finanzas-v1): no guarda estado propio que se pueda desincronizar.
 * Única excepción: `finanzas-resumen-v1`, una copia de solo lectura del ahorro real que escribe Finanzas al calcular
 * el plan (Hábitos no tiene el cálculo). Si falta o es vieja, el indicador lo dice. */
(function () {
  'use strict';
  var HAB = 'habitos-v1', FIN = 'finanzas-v1', PRIV = 'finanzas-ocultar-v1', RES = 'finanzas-resumen-v1';
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var key = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  var parse = function (k) { var p = k.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); };
  var addDays = function (d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; };
  var hoyK = function () { return key(new Date()); };
  /** Lunes de la semana de `d`. */
  var lunes = function (d) { var x = new Date(d); x.setHours(0, 0, 0, 0); return addDays(x, -((x.getDay() + 6) % 7)); };
  function leer(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }

  /* ---------- privacidad (ojito) ---------- */
  var privListeners = [];
  function privado() { try { return localStorage.getItem(PRIV) === '1'; } catch (e) { return false; } }
  function aplicarPrivado() { document.documentElement.classList.toggle('privado', privado()); }
  function setPrivado(v) {
    try { localStorage.setItem(PRIV, v ? '1' : '0'); } catch (e) {}
    aplicarPrivado();
    privListeners.forEach(function (f) { try { f(v); } catch (e) {} });
  }
  addEventListener('storage', function (e) { if (e.key === PRIV) { aplicarPrivado(); privListeners.forEach(function (f) { f(privado()); }); } });
  aplicarPrivado();

  /* ---------- feedback mínimo ---------- */
  var reduce = function () { return matchMedia('(prefers-reduced-motion: reduce)').matches; };
  function haptic(ms) { try { if (navigator.vibrate) navigator.vibrate(ms || 10); } catch (e) {} }

  /* ---------- hábitos: semanas y hitos ---------- */
  function normHab(s) {
    if (!s || !Array.isArray(s.habits)) return null;
    // Copia: nunca modifica el objeto de datos que recibe.
    return Object.assign({}, s, {
      log: s.log && typeof s.log === 'object' ? s.log : {},
      settings: Object.assign({ goal: 2, sound: true, weekMin: 4 }, s.settings || {})
    });
  }
  function dueH(h, k) { return k >= (h.since || '0000') && (h.days || []).indexOf(parse(k).getDay()) >= 0; }
  function doneH(s, h, k) { return (s.log[k] || []).indexOf(h.id) >= 0; }
  function dia(s, k) {
    var list = s.habits.filter(function (h) { return dueH(h, k); });
    var done = list.filter(function (h) { return doneH(s, h, k); }).length;
    return { due: list.length, done: done, met: list.length > 0 && done >= Math.min(s.settings.goal, list.length) };
  }
  /**
   * Una semana (lunes a domingo) es buena si cumplís la meta diaria en al menos `weekMin` días (por defecto 4).
   * Si esa semana hay menos días con hábitos programados, el mínimo baja a esa cantidad. Un día sin cumplir no rompe nada.
   * estado: 'buena' | 'floja' (terminó sin llegar) | 'en curso' | 'libre' (no había nada programado).
   */
  function semana(s, desde) {
    var hoy = hoyK(), cumplidos = 0, conHabitos = 0, quedan = 0, dias = [];
    for (var i = 0; i < 7; i++) {
      var k = key(addDays(desde, i)), d = dia(s, k);
      dias.push({ k: k, due: d.due, done: d.done, met: d.met, hoy: k === hoy, futuro: k > hoy });
      if (d.due) conHabitos++;
      if (d.met) cumplidos++;
      if (d.due && !d.met && k >= hoy) quedan++;
    }
    var minimo = Math.min(s.settings.weekMin || 4, conHabitos);
    var terminada = key(addDays(desde, 6)) < hoy;
    var estado = !conHabitos ? 'libre' : cumplidos >= minimo ? 'buena' : terminada ? 'floja' : 'en curso';
    return { desde: key(desde), dias: dias, cumplidos: cumplidos, minimo: minimo, conHabitos: conHabitos, estado: estado, posible: cumplidos + quedan >= minimo };
  }
  function inicioHabitos(s) {
    return s.habits.reduce(function (m, h) { return h.since && h.since < m ? h.since : m; }, hoyK());
  }
  /** Semanas buenas seguidas. La semana en curso suma si ya es buena; si todavía no, no corta la racha. */
  function rachaSemanas(s) {
    var run = 0, best = 0, semanas = [];
    if (!s.habits.length) return { actual: 0, mejor: 0, semanas: semanas, estaSemana: null };
    var ini = lunes(parse(inicioHabitos(s))), fin = lunes(new Date());
    for (var w = ini; w <= fin; w = addDays(w, 7)) {
      var se = semana(s, w);
      semanas.push(se);
      if (se.estado === 'buena') { run++; if (run > best) best = run; }
      else if (se.estado === 'floja') run = 0;
    }
    return { actual: run, mejor: best, semanas: semanas, estaSemana: semanas[semanas.length - 1] };
  }
  var UMBRALES = [10, 25, 50, 100, 250, 500];
  /**
   * Hitos derivados del log. Cada hábito tiene los suyos: sesiones (10, 25, 50…, o el número propio `h.hito`),
   * "un mes sin saltearte" (4 semanas seguidas sin fallar un día programado). Más los de semanas buenas.
   * Devuelve logrados (con fecha) y el próximo de cada hábito con su progreso.
   */
  function hitos(s) {
    s = normHab(s); if (!s) return { logrados: [], proximos: [] };
    var hoy = hoyK(), logrados = [], proximos = [];
    var dias = Object.keys(s.log).sort();
    s.habits.forEach(function (h) {
      var n = 0, fechas = [];
      dias.forEach(function (k) { if (s.log[k].indexOf(h.id) >= 0 && k <= hoy) { n++; fechas.push(k); } });
      var metas = UMBRALES.slice();
      if (h.hito > 0 && metas.indexOf(+h.hito) < 0) metas.push(+h.hito);
      metas.sort(function (a, b) { return a - b; });
      metas.forEach(function (m) {
        var propio = +h.hito === m;
        var t = h.name + ': ' + m + (m === 1 ? ' sesión' : ' sesiones');
        if (n >= m) logrados.push({ id: h.id + ':s' + m, habito: h.id, titulo: t, fecha: fechas[m - 1], propio: propio });
      });
      var prox = metas.filter(function (m) { return n < m; })[0];
      if (prox) proximos.push({ id: h.id + ':s' + prox, habito: h.id, titulo: h.name + ': ' + prox + ' sesiones', hechas: n, meta: prox, propio: +h.hito === prox });
      // Un mes sin saltearte: racha de días programados cumplidos que cubre 28 días o más. Hoy pendiente no corta.
      var runIni = null, mes = null;
      for (var d = parse(h.since || hoy); key(d) <= hoy; d = addDays(d, 1)) {
        var k = key(d);
        if (!dueH(h, k)) continue;
        if (doneH(s, h, k)) {
          if (!runIni) runIni = k;
          if (!mes && (parse(k) - parse(runIni)) / 864e5 >= 27) mes = k;
        } else if (k !== hoy) runIni = null;
      }
      if (mes) logrados.push({ id: h.id + ':mes', habito: h.id, titulo: h.name + ': un mes sin saltearte', fecha: mes });
    });
    var r = rachaSemanas(s), seguidas = 0, primera = null, cuatro = null, diez = 0, diezF = null;
    r.semanas.forEach(function (se) {
      var fin = key(addDays(parse(se.desde), 6));
      if (se.estado === 'buena') {
        seguidas++; diez++;
        if (!primera) primera = fin;
        if (seguidas === 4 && !cuatro) cuatro = fin;
        if (diez === 10) diezF = fin;
      } else if (se.estado === 'floja') seguidas = 0;
    });
    if (primera) logrados.push({ id: 'sem:1', titulo: 'Primera semana buena', fecha: primera > hoy ? hoy : primera });
    if (cuatro) logrados.push({ id: 'sem:4', titulo: '4 semanas buenas seguidas', fecha: cuatro > hoy ? hoy : cuatro });
    if (diezF) logrados.push({ id: 'sem:10', titulo: '10 semanas buenas', fecha: diezF > hoy ? hoy : diezF });
    logrados.sort(function (a, b) { return b.fecha.localeCompare(a.fecha); });
    return { logrados: logrados, proximos: proximos };
  }

  /* ---------- finanzas: registro (no gasto) ---------- */
  /** Días en que cargaste algo: un gasto o "hoy no gasté" (sinGasto). Un día sin carga NO es un día de gasto cero. */
  function diasRegistrados(f) {
    var set = {};
    if (!f) return set;
    (f.gastos || []).forEach(function (g) { set[g.fecha] = (set[g.fecha] || 0) + 1; });
    (f.sinGasto || []).forEach(function (k) { if (!set[k]) set[k] = 0; });
    return set;
  }
  /** Días seguidos con registro. Si hoy todavía no cargaste, cuenta hasta ayer (el día no terminó). */
  function rachaRegistro(f) {
    var set = diasRegistrados(f), d = new Date(), n = 0;
    var hoyReg = hoyK() in set;
    if (!hoyReg) d = addDays(d, -1);
    while (key(d) in set) { n++; d = addDays(d, -1); }
    return { dias: n, hoy: hoyReg };
  }
  /** Hitos del camino a la meta: 1.500, 3.000, 5.000 y de a 2.500 hasta la meta. */
  function caminoAhorro(meta) {
    if (!(meta > 0)) return [];
    var r = [1500, 3000, 5000].filter(function (v) { return v < meta; });
    for (var v = 7500; v < meta; v += 2500) r.push(v);
    r.push(meta);
    return r;
  }
  function resumenAhorro() { return leer(RES); }

  /** Resumen de una semana (lunes `desde`): hábitos, gastos cargados y cuánto te acercaste a la meta. */
  function resumenSemana(desde) {
    desde = desde || lunes(new Date());
    var ini = key(desde), fin = key(addDays(desde, 6));
    var s = normHab(leer(HAB)), f = leer(FIN), a = resumenAhorro();
    var out = { desde: ini, hasta: fin, habitos: null, gastos: null, ahorro: null };
    if (s && s.habits.length) out.habitos = semana(s, desde);
    if (f) {
      var reg = diasRegistrados(f), dias = 0, n = 0;
      Object.keys(reg).forEach(function (k) { if (k >= ini && k <= fin) { dias++; n += reg[k]; } });
      var usd = 0;
      Object.keys(f.checks || {}).forEach(function (m) {
        var c = f.checks[m];
        if (c && typeof c === 'object' && c.fecha >= ini && c.fecha <= fin) usd += +c.usd || 0;
      });
      out.gastos = { cargados: n, dias: dias };
      out.ahorro = { usdSemana: usd, real: a ? a.real : null, meta: a ? a.meta : null };
    }
    return out;
  }

  /** El indicador común (una línea): semana de hábitos · registro de gastos · rumbo a la meta. */
  function pulso() {
    var s = normHab(leer(HAB)), f = leer(FIN), a = resumenAhorro();
    var p = { habitos: null, registro: null, meta: null };
    if (s && s.habits.length) {
      var r = rachaSemanas(s);
      p.habitos = { cumplidos: r.estaSemana.cumplidos, minimo: r.estaSemana.minimo, estado: r.estaSemana.estado, racha: r.actual };
    }
    if (f && ((f.gastos || []).length || (f.sinGasto || []).length)) p.registro = rachaRegistro(f);
    if (a && a.meta > 0) p.meta = { pct: a.real / a.meta, real: a.real, meta: a.meta };
    return p;
  }

  /** La misma frase en los dos módulos: "4 de 4. Semana buena." / "5 días, el mínimo era 4. Semana buena." */
  function fraseSemana(se) {
    if (!se) return '';
    if (se.estado === 'libre') return 'Semana sin hábitos programados.';
    if (se.estado === 'buena') return se.cumplidos > se.minimo ? se.cumplidos + ' días, el mínimo era ' + se.minimo + '. Semana buena.' : se.cumplidos + ' de ' + se.minimo + '. Semana buena.';
    if (se.estado === 'floja') return se.cumplidos + ' de ' + se.minimo + '. No llegó.';
    return se.cumplidos + ' de ' + se.minimo + ' días con la meta diaria.';
  }

  /** Ráfaga corta de chispas de colores desde un elemento (al tildar un hábito o un ahorro). */
  var COLORES = ['#22C468', '#2F86F6', '#FFB020', '#FF7A2F', '#8B5CF6', '#E5484D'];
  function chispas(el) {
    try {
      if (!el || reduce()) return;
      var r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      var cont = document.createElement('div'); cont.className = 'chispas'; cont.setAttribute('aria-hidden', 'true');
      for (var i = 0; i < 14; i++) {
        var a = (Math.PI * 2 * i) / 14 + Math.random() * 0.4, d = 40 + Math.random() * 46;
        var p = document.createElement('i');
        p.style.left = cx - 5 + 'px'; p.style.top = cy - 5 + 'px';
        p.style.background = COLORES[i % COLORES.length];
        p.style.setProperty('--dx', Math.cos(a) * d + 'px'); p.style.setProperty('--dy', Math.sin(a) * d - 20 + 'px');
        if (i % 3 === 0) p.style.borderRadius = '50%';
        cont.appendChild(p);
      }
      document.body.appendChild(cont);
      setTimeout(function () { cont.remove(); }, 1000);
    } catch (e) {}
  }

  window.Comun = {
    fraseSemana: fraseSemana, chispas: chispas,
    key: key, parse: parse, addDays: addDays, lunes: lunes, hoyK: hoyK,
    privado: privado, setPrivado: setPrivado, onPrivado: function (f) { privListeners.push(f); },
    haptic: haptic, reduce: reduce,
    semana: function (s, d) { return semana(normHab(s), d); }, rachaSemanas: function (s) { return rachaSemanas(normHab(s)); },
    hitos: hitos, rachaRegistro: rachaRegistro, diasRegistrados: diasRegistrados, caminoAhorro: caminoAhorro,
    resumenAhorro: resumenAhorro, resumenSemana: resumenSemana, pulso: pulso, RES: RES
  };
})();
