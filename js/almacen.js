/* ===== Almacén local de HidraMetric =====
   Fuente de verdad del historial: IndexedDB. Respaldo si no está disponible: localStorage.
   Almacenes: tomas (eventos recientes) · dias (resumen diario) · meses (resumen mensual) · meta.
   Sin dependencias: puede cargarse y probarse por separado. Diseño y justificación: docs/almacenamiento.md */
const ALM = (() => {
  const DB = "hidrametric",
    VER = 1,
    RET_RAW = 90,
    RET_DIA = 730,
    FB_KEY = "hm.fb.v1",
    KEY = { tomas: "id", dias: "d", meses: "m", meta: "k" };
  let db = null,
    modo = "idb",
    FB = null,
    bc = null;
  const p2 = (n) => String(n).padStart(2, "0");
  const fecha = (t) => {
    const x = new Date(t);
    return x.getFullYear() + "-" + p2(x.getMonth() + 1) + "-" + p2(x.getDate());
  };
  const partes = (d) => d.split("-").map(Number);
  const sumar = (d, n) => {
    const [y, m, k] = partes(d);
    return fecha(new Date(y, m - 1, k + n, 12));
  };
  const ultimo = (m) => {
    const [y, k] = partes(m);
    return y + "-" + p2(k) + "-" + p2(new Date(y, k, 0).getDate());
  };
  const RE_D = /^\d{4}-\d{2}-\d{2}$/,
    RE_M = /^\d{4}-\d{2}$/;
  const nuevoId = (t) =>
    Math.round(t).toString(36) + "-" + Math.random().toString(36).slice(2, 6);
  const ent = (v, max) => {
    v = Math.round(+v);
    return Number.isFinite(v) && v >= 0 && v <= max ? v : 0;
  };

  /* --- validación y saneado de lo que entra (incluye archivos importados) --- */
  function limpia(o) {
    if (!o) return null;
    const t = Math.round(+o.t),
      ml = Math.round(+o.ml);
    if (!(t > 0 && t < Date.now() + 864e5 && ml >= 1 && ml <= 1500))
      return null;
    const tipo =
      String(o.tipo || "agua")
        .replace(/[^a-z0-9_]/gi, "")
        .slice(0, 24) || "agua";
    return {
      id:
        String(o.id || nuevoId(t))
          .replace(/[^\w.-]/g, "")
          .slice(0, 64) || nuevoId(t),
      t,
      d: RE_D.test(o.d) ? o.d : fecha(t),
      ml,
      tipo,
      c: o.c ? 1 : 0,
    };
  }
  const lpt = (o) => {
    const r = {};
    if (o && typeof o === "object")
      for (const k of Object.keys(o).slice(0, 40)) {
        const kk = k.replace(/[^a-z0-9_]/gi, "").slice(0, 24);
        if (kk && kk[0] !== "_") r[kk] = ent(o[k], 1e9);
      }
    return r;
  };
  const limpiaDia = (x) =>
    x && RE_D.test(x.d)
      ? {
          d: x.d,
          ml: ent(x.ml, 1e7),
          n: ent(x.n, 1e5),
          meta: ent(x.meta, 1e5),
          porTipo: lpt(x.porTipo),
          v: 1,
        }
      : null;
  const limpiaMes = (x) =>
    x && RE_M.test(x.m)
      ? {
          m: x.m,
          ml: ent(x.ml, 1e9),
          dias: ent(x.dias, 31),
          cumplidos: ent(x.cumplidos, 31),
          porTipo: lpt(x.porTipo),
          v: 1,
        }
      : null;

  /* --- motor IndexedDB --- */
  const rq = (r) =>
    new Promise((ok, ko) => {
      r.onsuccess = () => ok(r.result);
      r.onerror = () => ko(r.error);
    });
  function migrar(d, old) {
    if (old < 1) {
      const t = d.createObjectStore("tomas", { keyPath: "id" });
      t.createIndex("d", "d");
      d.createObjectStore("dias", { keyPath: "d" });
      d.createObjectStore("meses", { keyPath: "m" });
      d.createObjectStore("meta", { keyPath: "k" });
    }
    /* Futuras versiones: if(old<2){ ...crear almacén o índice, o recorrer registros con un cursor y transformarlos... } */
  }
  const abrir = () =>
    new Promise((ok, ko) => {
      const r = indexedDB.open(DB, VER);
      r.onupgradeneeded = (e) => migrar(r.result, e.oldVersion);
      r.onsuccess = () => {
        const d = r.result;
        d.onversionchange = () => {
          d.close();
          if (db === d) db = null;
        };
        ok(d);
      };
      r.onerror = () => ko(r.error);
      r.onblocked = () => ko(new Error("apertura bloqueada por otra pestaña"));
    });
  const apiIDB = (t) => {
    const O = (s) => t.objectStore(s);
    return {
      get: (s, k) => rq(O(s).get(k)),
      put: (s, v) => rq(O(s).put(v)),
      del: (s, k) => rq(O(s).delete(k)),
      porDia: (d) => rq(O("tomas").index("d").getAll(d)),
      rango: (s, a, b) => rq(O(s).getAll(IDBKeyRange.bound(a, b))),
      antes: (c, n) =>
        rq(O("tomas").index("d").getAll(IDBKeyRange.upperBound(c, true), n)),
      todos: (s) => rq(O(s).getAll()),
      n: (s) => rq(O(s).count()),
    };
  };
  async function txIDB(stores, fn, rw) {
    if (!db) db = await abrir();
    return new Promise((ok, ko) => {
      let t, res;
      try {
        t = db.transaction(
          stores,
          rw ? "readwrite" : "readonly",
          rw ? { durability: "strict" } : undefined,
        );
      } catch (e) {
        return ko(e);
      }
      t.oncomplete = () => ok(res);
      t.onabort = () => ko(t.error || new Error("transacción cancelada"));
      let pr;
      try {
        pr = Promise.resolve(fn(apiIDB(t)));
      } catch (e) {
        pr = Promise.reject(e);
      }
      pr.then(
        (r) => {
          res = r;
        },
        (e) => {
          try {
            t.abort();
          } catch (_) {}
          ko(e);
        },
      );
    });
  }
  /* --- motor de respaldo (localStorage, todo el conjunto en una clave; solo si no hay IndexedDB) --- */
  const guardarFB = () => {
    try {
      localStorage.setItem(FB_KEY, JSON.stringify(FB));
    } catch (e) {
      throw new Error("almacenamiento lleno");
    }
  };
  const apiFB = () => ({
    get: (s, k) => Promise.resolve(FB[s][k]),
    put: (s, v) => {
      FB[s][v[KEY[s]]] = v;
      return Promise.resolve();
    },
    del: (s, k) => {
      delete FB[s][k];
      return Promise.resolve();
    },
    porDia: (d) =>
      Promise.resolve(Object.values(FB.tomas).filter((x) => x.d === d)),
    rango: (s, a, b) =>
      Promise.resolve(
        Object.keys(FB[s])
          .filter((k) => k >= a && k <= b)
          .sort()
          .map((k) => FB[s][k]),
      ),
    antes: (c, n) =>
      Promise.resolve(
        Object.values(FB.tomas)
          .filter((x) => x.d < c)
          .sort((x, y) => (x.d < y.d ? -1 : 1))
          .slice(0, n),
      ),
    todos: (s) => Promise.resolve(Object.values(FB[s])),
    n: (s) => Promise.resolve(Object.keys(FB[s]).length),
  });
  async function txFB(fn, rw) {
    if (!rw) return fn(apiFB());
    const snap = JSON.stringify(FB);
    try {
      const r = await fn(apiFB());
      guardarFB();
      return r;
    } catch (e) {
      FB = JSON.parse(snap);
      throw e;
    }
  }
  const tx = (stores, fn, rw = true) =>
    modo === "idb" ? txIDB(stores, fn, rw) : txFB(fn, rw);

  /* --- agregados: siempre se recalculan desde las tomas del día (idempotente y autorreparable) --- */
  const agregar = (ev, meta, d) => {
    const o = { d, ml: 0, n: ev.length, meta: meta || 0, porTipo: {}, v: 1 };
    for (const e of ev) {
      o.porTipo[e.tipo] = (o.porTipo[e.tipo] || 0) + e.ml;
      if (e.c) o.ml += e.ml;
    }
    return o;
  };
  async function recomputar(S, d, meta) {
    const ev = await S.porDia(d);
    if (!ev.length) {
      await S.del("dias", d);
      return null;
    }
    const prev = await S.get("dias", d),
      o = agregar(ev, meta || (prev && prev.meta) || 0, d);
    await S.put("dias", o);
    return o;
  }

  const avisar = () => {
    try {
      bc && bc.postMessage(1);
    } catch (e) {}
  };
  const onCambio = (f) => {
    if (bc) bc.onmessage = () => f();
  };

  async function iniciar() {
    try {
      if (!window.indexedDB) throw new Error("sin IndexedDB");
      modo = "idb";
      db = await abrir();
      await tx(["meta"], (S) => S.put("meta", { k: "sonda", v: Date.now() }));
    } catch (e) {
      try {
        if (db) db.close();
      } catch (_) {}
      db = null;
      modo = "local";
      try {
        FB = JSON.parse(localStorage.getItem(FB_KEY));
      } catch (_) {
        FB = null;
      }
      FB = FB || { tomas: {}, dias: {}, meses: {}, meta: {} };
    }
    try {
      if (window.BroadcastChannel && !bc)
        bc = new BroadcastChannel("hidrametric-alm");
    } catch (e) {}
    return modo;
  }

  /* --- escritura --- */
  async function registrarVarios(arr, meta) {
    const L = arr.map(limpia).filter(Boolean),
      por = {};
    L.forEach((x) => (por[x.d] = por[x.d] || []).push(x));
    for (const d of Object.keys(por))
      await tx(["tomas", "dias"], async (S) => {
        for (const x of por[d]) await S.put("tomas", x);
        return recomputar(S, d, meta);
      });
    if (L.length) avisar();
    return L.length;
  }
  async function registrar(o, meta) {
    const x = limpia(o);
    if (!x) throw new Error("toma no válida");
    await tx(["tomas", "dias"], async (S) => {
      await S.put("tomas", x);
      return recomputar(S, x.d, meta);
    });
    avisar();
    return x;
  }
  async function quitar(id) {
    const ok = await tx(["tomas", "dias"], async (S) => {
      const r = await S.get("tomas", id);
      if (!r) return false;
      await S.del("tomas", id);
      await recomputar(S, r.d);
      return true;
    });
    if (ok) avisar();
    return ok;
  }
  async function borrarDia(d) {
    await tx(["tomas", "dias"], async (S) => {
      for (const e of await S.porDia(d)) await S.del("tomas", e.id);
      await S.del("dias", d);
    });
    avisar();
  }

  /* --- lectura: día, semana (lunes a domingo) y mes, sin cargar todo en memoria --- */
  const vacio = (d) => ({ d, ml: 0, n: 0, meta: 0, porTipo: {} });
  const tomasDe = async (d) =>
    (await tx(["tomas"], (S) => S.porDia(d), false)).sort((a, b) => a.t - b.t);
  const dia = async (d) =>
    (await tx(["dias"], (S) => S.get("dias", d), false)) || vacio(d);
  function resumen(desde, hasta, dias) {
    const con = dias.filter((x) => x.n > 0),
      ml = dias.reduce((s, x) => s + x.ml, 0),
      pt = {};
    dias.forEach((x) => {
      for (const k in x.porTipo) pt[k] = (pt[k] || 0) + x.porTipo[k];
    });
    return {
      desde,
      hasta,
      dias,
      ml,
      diasConDatos: con.length,
      promedio: con.length ? Math.round(ml / con.length) : 0,
      cumplidos: con.filter((x) => x.meta > 0 && x.ml >= x.meta).length,
      porTipo: pt,
      origen: "dias",
    };
  }
  async function rangoDias(desde, hasta) {
    const r = await tx(["dias"], (S) => S.rango("dias", desde, hasta), false),
      mp = {};
    r.forEach((x) => {
      mp[x.d] = x;
    });
    const out = [];
    for (let d = desde; d <= hasta; d = sumar(d, 1))
      out.push(mp[d] || vacio(d));
    return out;
  }
  async function semana(d) {
    const [y, m, k] = partes(d),
      dow = (new Date(y, m - 1, k, 12).getDay() + 6) % 7,
      desde = sumar(d, -dow),
      hasta = sumar(desde, 6);
    return resumen(desde, hasta, await rangoDias(desde, hasta));
  }
  async function mes(m) {
    const desde = m + "-01",
      hasta = ultimo(m),
      a = await tx(["meses"], (S) => S.get("meses", m), false);
    if (a)
      return {
        desde,
        hasta,
        dias: null,
        ml: a.ml,
        diasConDatos: a.dias,
        promedio: a.dias ? Math.round(a.ml / a.dias) : 0,
        cumplidos: a.cumplidos,
        porTipo: a.porTipo,
        origen: "meses",
      };
    return resumen(desde, hasta, await rangoDias(desde, hasta));
  }

  /* --- retención: tomas 90 días → resumen diario 24 meses → resumen mensual sin límite --- */
  async function compactar(hoyD) {
    hoyD = hoyD || fecha(Date.now());
    const cRaw = sumar(hoyD, -RET_RAW),
      cDia = sumar(hoyD, -RET_DIA);
    let raw = 0,
      mm = 0;
    for (;;) {
      const n = await tx(["tomas", "dias"], async (S) => {
        const ev = await S.antes(cRaw, 400);
        if (!ev.length) return 0;
        let c = 0;
        for (const d of [...new Set(ev.map((e) => e.d))]) {
          const todos = await S.porDia(d);
          if (!(await S.get("dias", d))) await recomputar(S, d);
          for (const e of todos) {
            await S.del("tomas", e.id);
            c++;
          }
        }
        return c;
      });
      if (!n) break;
      raw += n;
    }
    const viejos = await tx(
        ["dias"],
        (S) => S.rango("dias", "0000-00-00", sumar(cDia, -1)),
        false,
      ),
      pm = {};
    viejos.forEach((x) => {
      const k = x.d.slice(0, 7);
      (pm[k] = pm[k] || []).push(x);
    });
    for (const m of Object.keys(pm)) {
      if (ultimo(m) >= cDia) continue;
      await tx(["dias", "meses"], async (S) => {
        const a = await S.get("meses", m),
          o = a || { m, ml: 0, dias: 0, cumplidos: 0, porTipo: {}, v: 1 };
        for (const x of pm[m]) {
          o.ml += x.ml;
          o.dias++;
          if (x.meta > 0 && x.ml >= x.meta) o.cumplidos++;
          for (const k in x.porTipo)
            o.porTipo[k] = (o.porTipo[k] || 0) + x.porTipo[k];
          await S.del("dias", x.d);
        }
        await S.put("meses", o);
      });
      mm++;
    }
    await tx(["meta"], (S) => S.put("meta", { k: "lastCompact", v: hoyD }));
    return { raw, meses: mm };
  }
  /* Comprueba que el resumen de los últimos días coincide con sus tomas y lo repara si no. */
  async function verificar(n = 7, hoyD) {
    hoyD = hoyD || fecha(Date.now());
    n = Math.min(n, RET_RAW);
    let sanados = 0;
    for (let i = 0; i < n; i++) {
      const d = sumar(hoyD, -i);
      sanados += await tx(["tomas", "dias"], async (S) => {
        const prev = await S.get("dias", d),
          nuevo = await recomputar(S, d);
        return (!prev && !nuevo) ||
          (prev && nuevo && prev.ml === nuevo.ml && prev.n === nuevo.n)
          ? 0
          : 1;
      });
    }
    return sanados;
  }
  async function mantenimiento() {
    const hoyD = fecha(Date.now());
    await verificar(7, hoyD);
    const lc = await tx(["meta"], (S) => S.get("meta", "lastCompact"), false),
      r = !lc || lc.v < sumar(hoyD, -7) ? await compactar(hoyD) : null;
    try {
      if (
        navigator.storage &&
        navigator.storage.persist &&
        !(await navigator.storage.persisted())
      ) {
        const n = await tx(["dias"], (S) => S.n("dias"), false);
        if (n >= 7) await navigator.storage.persist();
      }
    } catch (e) {}
    return r;
  }

  /* --- copia de seguridad --- */
  async function exportar() {
    const o = await tx(
      ["tomas", "dias", "meses"],
      async (S) => ({
        tomas: await S.todos("tomas"),
        dias: await S.todos("dias"),
        meses: await S.todos("meses"),
      }),
      false,
    );
    return {
      app: "hidrametric",
      esquema: VER,
      exportado: new Date().toISOString(),
      ...o,
    };
  }
  async function importar(o) {
    if (!o || o.app !== "hidrametric" || !(o.esquema >= 1) || o.esquema > VER)
      throw new Error("El archivo no es una copia compatible de HidraMetric.");
    if (!Array.isArray(o.tomas) || o.tomas.length > 200000)
      throw new Error("El archivo no tiene un formato válido.");
    const cRaw = sumar(fecha(Date.now()), -RET_RAW),
      buenas = o.tomas.map(limpia).filter((x) => x && x.d >= cRaw);
    for (let i = 0; i < buenas.length; i += 200)
      await registrarVarios(buenas.slice(i, i + 200), 0);
    let d = 0,
      m = 0;
    for (const x of (Array.isArray(o.dias) ? o.dias : [])
      .map(limpiaDia)
      .filter(Boolean))
      d += await tx(["dias"], async (S) => {
        const p = await S.get("dias", x.d);
        if (!p) {
          await S.put("dias", x);
          return 1;
        }
        if (!p.meta && x.meta) await S.put("dias", { ...p, meta: x.meta });
        return 0;
      });
    for (const x of (Array.isArray(o.meses) ? o.meses : [])
      .map(limpiaMes)
      .filter(Boolean))
      m += await tx(["meses"], async (S) => {
        if (await S.get("meses", x.m)) return 0;
        await S.put("meses", x);
        return 1;
      });
    avisar();
    return { tomas: buenas.length, dias: d, meses: m };
  }
  async function info() {
    const [t, d, m] = await tx(
      ["tomas", "dias", "meses"],
      (S) => Promise.all([S.n("tomas"), S.n("dias"), S.n("meses")]),
      false,
    );
    let est = null,
      pers = null;
    try {
      est = await navigator.storage.estimate();
      pers = await navigator.storage.persisted();
    } catch (e) {}
    return {
      modo,
      tomas: t,
      dias: d,
      meses: m,
      usado: est && est.usage,
      cuota: est && est.quota,
      persistente: pers,
    };
  }

  return {
    iniciar,
    registrar,
    registrarVarios,
    quitar,
    borrarDia,
    tomasDe,
    dia,
    semana,
    mes,
    compactar,
    verificar,
    mantenimiento,
    exportar,
    importar,
    info,
    fecha,
    sumar,
    nuevoId,
    onCambio,
    modo: () => modo,
    RET_RAW,
    RET_DIA,
    _tx: tx,
  };
})();
