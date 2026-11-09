import { productosIniciales } from "./productos.js";
/* Datos locales de demostración. Como en el ejemplo del curso, NO es
   autenticación real: el navegador permite inspeccionar y modificar todo. */
// La inyección de almacenamiento, reloj e identificadores permite pruebas aisladas.
export function crearTienda({
  localStorage = window.localStorage,
  sessionStorage = window.sessionStorage,
  ahora = () => Date.now(),
  uuid = () => crypto.randomUUID(),
  productos = productosIniciales,
} = {}) {
  const KEY = "powersystem_db_v2",
    SESSION = "powersystem_sesion_v2";
  const usuarios = [
    {
      id: 1,
      usuario: "admin",
      nombre: "Administración",
      clave: "Admin123",
      rol: "admin",
    },
    {
      id: 2,
      usuario: "jperez",
      nombre: "Juan Pérez",
      clave: "User123",
      rol: "user",
      email: "cliente@example.test",
      direccion: "Calle de prueba 123",
      comuna: "Santiago",
    },
    {
      id: 3,
      usuario: "mrojas",
      nombre: "María Rojas",
      clave: "User123",
      rol: "user",
      email: "cliente@example.test",
      direccion: "Calle de prueba 123",
      comuna: "Santiago",
    },
  ];
  function guardar(db) {
    localStorage.setItem(KEY, JSON.stringify(db));
  }
  function cargar() {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const db = {
        productos: productos.map((p) => ({ ...p })),
        carritos: {},
        arriendos: [],
      };
      guardar(db);
      return db;
    }
    try {
      const db = JSON.parse(raw);
      if (
        !Array.isArray(db.productos) ||
        !Array.isArray(db.arriendos) ||
        !db.carritos
      )
        throw Error();
      return db;
    } catch {
      throw Error(
        "No se pudieron leer los datos locales. Consulta el README para recuperar la demostración.",
      );
    }
  }
  function sesion() {
    try {
      const s = JSON.parse(sessionStorage.getItem(SESSION));
      const u = usuarios.find((u) => u.id === s?.id && u.rol === s.rol);
      if (!u || !Number.isFinite(s.expira) || ahora() >= s.expira) {
        sessionStorage.removeItem(SESSION);
        return null;
      }
      return { ...s, nombre: u.nombre, usuario: u.usuario };
    } catch {
      sessionStorage.removeItem(SESSION);
      return null;
    }
  }
  function exigir(rol) {
    const s = sesion();
    if (!s || s.rol !== rol)
      throw Error("Debes iniciar sesión con el rol correspondiente.");
    return s;
  }
  function ingresar(usuario, clave) {
    const k = "powersystem_intentos_v2";
    let fallos;
    try {
      fallos = JSON.parse(localStorage.getItem(k)) || { n: 0, hasta: 0 };
    } catch {
      fallos = { n: 0, hasta: 0 };
    }
    if (fallos.hasta > ahora())
      throw Error(
        "Demasiados intentos. Espera " +
          Math.ceil((fallos.hasta - ahora()) / 1000) +
          " segundos.",
      );
    const u = usuarios.find(
      (u) => u.usuario === usuario.trim().toLowerCase() && u.clave === clave,
    );
    if (!u) {
      fallos.n++;
      if (fallos.n >= 5) {
        fallos.n = 0;
        fallos.hasta = ahora() + 60000;
      }
      localStorage.setItem(k, JSON.stringify(fallos));
      throw Error("Usuario o contraseña incorrectos.");
    }
    localStorage.removeItem(k);
    const { clave: omitida, ...s } = u;
    s.expira = ahora() + 30 * 60 * 1000;
    sessionStorage.setItem(SESSION, JSON.stringify(s));
    return s;
  }
  function salir() {
    sessionStorage.removeItem(SESSION);
  }
  function carrito(db, id) {
    return db.carritos[id] || { dias: 1, items: [] };
  }
  function entero(n, min, max) {
    return Number.isSafeInteger(n) && n >= min && n <= max;
  }
  function agregar(id) {
    const s = exigir("user"),
      db = cargar(),
      p = db.productos.find((p) => p.id === id),
      c = carrito(db, s.id);
    if (!p || !p.activo) throw Error("Este producto ya no está disponible.");
    let item = c.items.find((i) => i.id === id);
    const q = (item?.cantidad || 0) + 1;
    if (q > p.stock)
      throw Error("No hay más unidades disponibles de este equipo.");
    if (item) item.cantidad = q;
    else c.items.push({ id, cantidad: 1 });
    db.carritos[s.id] = c;
    guardar(db);
  }
  function cambiarCantidad(id, cantidad) {
    const s = exigir("user"),
      db = cargar(),
      c = carrito(db, s.id),
      p = db.productos.find((p) => p.id === id);
    if (!entero(cantidad, 1, 9999))
      throw Error("La cantidad debe ser un entero mayor que cero.");
    if (!p || !p.activo || cantidad > p.stock)
      throw Error("La cantidad supera la disponibilidad actual.");
    const i = c.items.find((i) => i.id === id);
    if (!i) throw Error("El producto no está en el carrito.");
    i.cantidad = cantidad;
    db.carritos[s.id] = c;
    guardar(db);
  }
  function quitar(id) {
    const s = exigir("user"),
      db = cargar(),
      c = carrito(db, s.id);
    c.items = c.items.filter((i) => i.id !== id);
    db.carritos[s.id] = c;
    guardar(db);
  }
  function dias(n) {
    if (!entero(n, 1, 365)) throw Error("Indica entre 1 y 365 días completos.");
    const s = exigir("user"),
      db = cargar(),
      c = carrito(db, s.id);
    c.dias = n;
    db.carritos[s.id] = c;
    guardar(db);
  }
  function cotizar(db, c) {
    if (!entero(c.dias, 1, 365) || !c.items.length)
      throw Error("El carrito está vacío o su duración no es válida.");
    return c.items.map((i) => {
      const p = db.productos.find((p) => p.id === i.id);
      if (!p || !p.activo)
        throw Error(
          "Un equipo fue retirado del catálogo. Quítalo del carrito para continuar.",
        );
      if (!entero(i.cantidad, 1, p.stock))
        throw Error("Revisa la disponibilidad de " + p.nombre + ".");
      return {
        id: p.id,
        codigo: p.codigo,
        nombre: p.nombre,
        precio: tarifa(p),
        valorBase: p.valorBase ?? 0,
        cantidad: i.cantidad,
        subtotal: ((p.valorBase ?? 0) + tarifa(p) * c.dias) * i.cantidad,
      };
    });
  }
  // Stock, historial y vaciado del carrito se guardan juntos en una sola escritura.
  // Primero validamos todo. Solo la confirmación exitosa escribe stock e historial.
  function finalizar(entrega) {
    validarEntrega(entrega);
    if (entrega.resultado === "rechazado")
      throw Error("El pago simulado fue rechazado. Tu carrito se conserva.");
    const s = exigir("user"),
      db = cargar(),
      c = carrito(db, s.id),
      items = cotizar(db, c);
    const inicio = new Date(ahora()),
      fin = new Date(inicio);
    fin.setDate(fin.getDate() + c.dias);
    const a = {
      id: "PS-" + uuid().slice(0, 8).toUpperCase(),
      usuarioId: s.id,
      cliente: s.nombre,
      inicio: inicio.toISOString(),
      fin: fin.toISOString(),
      dias: c.dias,
      items,
      total: items.reduce((sum, i) => sum + i.subtotal, 0),
      estado: "Confirmado",
      entrega: {
        nombre: entrega.nombre.trim(),
        email: entrega.email.trim(),
        direccion: entrega.direccion.trim(),
        comuna: entrega.comuna.trim(),
        metodo: entrega.metodo,
      },
      pago: "Simulado",
    };
    for (const i of items)
      db.productos.find((p) => p.id === i.id).stock -= i.cantidad;
    db.arriendos.unshift(a);
    db.carritos[s.id] = { dias: 1, items: [] };
    guardar(db);
    return a;
  }
  function guardarProducto(datos, id) {
    exigir("admin");
    const db = cargar();
    const d = {
      ...datos,
      codigo: datos.codigo.trim().toUpperCase(),
      nombre: datos.nombre.trim(),
      descripcion: datos.descripcion.trim(),
    };
    if (!/^[A-Z0-9-]{2,20}$/.test(d.codigo))
      throw Error("El código debe tener de 2 a 20 letras, números o guiones.");
    if (
      db.productos.some(
        (p) => p.codigo.toUpperCase() === d.codigo && p.id !== id,
      )
    )
      throw Error("Ya existe un producto con ese código.");
    if (
      d.nombre.length < 3 ||
      d.nombre.length > 80 ||
      !d.descripcion ||
      d.descripcion.length > 180
    )
      throw Error("Revisa el nombre y la descripción.");
    if (
      ![
        "Computación",
        "Audiovisual",
        "Redes",
        "Accesorios",
        "Oficina y Papelería",
      ].includes(d.categoria)
    )
      throw Error("Selecciona una categoría válida.");
    if (!entero(d.precio, 1, 9999999) || !entero(d.stock, 0, 9999))
      throw Error(
        "Precio y stock deben ser enteros dentro de los límites permitidos.",
      );
    if (!entero(d.valorBase ?? 0, 0, 9999999))
      throw Error("El valor base debe ser un entero entre 0 y 9999999.");
    if (!entero(d.descuento ?? 0, 0, 80))
      throw Error("El descuento debe ser un entero entre 0 y 80.");
    if (d.imagen && !/^\/productos\/[a-zA-Z0-9_.-]+$/.test(d.imagen))
      throw Error("Selecciona una imagen local válida.");
    if (id) {
      const i = db.productos.findIndex((p) => p.id === id);
      if (i < 0) throw Error("El producto ya no existe.");
      db.productos[i] = { id, ...d };
    } else db.productos.push({ id: uuid(), ...d });
    guardar(db);
  }
  function eliminar(id) {
    exigir("admin");
    const db = cargar();
    db.productos = db.productos.filter((p) => p.id !== id);
    guardar(db);
  }
  // La devolución es manual para que el inventario refleje la entrega física.
  function devolver(id) {
    exigir("admin");
    const db = cargar(),
      a = db.arriendos.find((a) => a.id === id);
    if (!a || a.estado !== "Confirmado")
      throw Error("Este arriendo ya no admite devolución.");
    for (const i of a.items) {
      const p = db.productos.find((p) => p.id === i.id);
      if (p) p.stock += i.cantidad;
    }
    a.estado = "Devuelto";
    guardar(db);
  }
  return {
    cargar,
    sesion,
    ingresar,
    salir,
    exigir,
    carrito,
    agregar,
    cambiarCantidad,
    quitar,
    dias,
    cotizar,
    finalizar,
    guardarProducto,
    eliminar,
    devolver,
  };
}

// Precio por día después del descuento de demostración; siempre en pesos enteros.
export function tarifa(producto) {
  return Math.round(
    (producto.precio * (100 - (producto.descuento || 0))) / 100,
  );
}

export function validarEntrega(d) {
  if (!d || d.nombre?.trim().length < 3 || !d.nombre?.trim())
    throw Error("Ingresa tu nombre completo.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email || ""))
    throw Error("Ingresa un correo válido.");
  if (!["retiro", "despacho"].includes(d.metodo))
    throw Error("Selecciona una opción de entrega.");
  if (
    !d.direccion ||
    d.direccion.trim().length < 5 ||
    !d.comuna ||
    d.comuna.trim().length < 2
  )
    throw Error("Completa la dirección y comuna.");
  if (!["aprobado", "rechazado"].includes(d.resultado))
    throw Error("Selecciona el resultado de la simulación.");
  if (!d.aceptado) throw Error("Confirma que se trata de un pago simulado.");
}

