import { productosPrueba } from "./productosPrueba";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { crearTienda, tarifa, validarEntrega } from "../src/data/tienda";
import {
  ProductCard,
  ListaProductos,
  Mensaje,
  Campo,
  Resumen,
  Vacio,
} from "../src/components/UI";
import {
  CheckoutForm,
  Carrito,
  Checkout,
  Resultado,
  Arriendos,
} from "../src/pages/Compra";
import { ProductForm, Admin } from "../src/pages/Admin";
import { Login, Protegida } from "../src/pages/Cuenta";
import { Catalogo, Inicio, Categorias, Detalle } from "../src/pages/Catalogo";
import { TiendaProvider } from "../src/context";
import App from "../src/App";
window.IS_REACT_ACT_ENVIRONMENT = true;
function memoria() {
  const m = new Map();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
}
const entrega = () => ({
  nombre: "Cliente Prueba",
  email: "cliente@example.test",
  direccion: "Calle Ficticia 123",
  comuna: "Santiago",
  metodo: "retiro",
  resultado: "aprobado",
  aceptado: true,
});
let tienda, local, sesion, clock;
beforeEach(() => {
  local = memoria();
  sesion = memoria();
  clock = 100000;
  let n = 0;
  tienda = crearTienda({
    productos: productosPrueba,
    localStorage: local,
    sessionStorage: sesion,
    ahora: () => clock,
    uuid: () => String(++n).padStart(8, "0"),
  });
});
function cliente() {
  tienda.ingresar("jperez", "User123");
}
function admin() {
  tienda.salir();
  tienda.ingresar("admin", "Admin123");
}
function comprar() {
  cliente();
  tienda.agregar("p1");
  tienda.cambiarCantidad("p1", 2);
  tienda.dias(3);
  return tienda.finalizar(entrega());
}

describe("Datos y reglas de arriendo", () => {
  it("crea seis equipos al abrir un almacenamiento vacío", () =>
    expect(tienda.cargar().productos.length).toBe(6));
  it("conserva datos entre instancias del servicio", () => {
    cliente();
    tienda.agregar("p1");
    const otra = crearTienda({
      productos: productosPrueba,
      localStorage: local,
      sessionStorage: sesion,
      ahora: () => clock,
    });
    expect(otra.carrito(otra.cargar(), 2).items.length).toBe(1);
  });
  it("informa datos corruptos sin sobrescribirlos", () => {
    local.setItem("powersystem_db_v2", "x");
    expect(() => tienda.cargar()).toThrowError(/leer/);
    expect(local.getItem("powersystem_db_v2")).toBe("x");
  });
  it("normaliza usuario y no copia la clave a sesión", () => {
    const u = tienda.ingresar(" JPEREZ ", "User123");
    expect(u.rol).toBe("user");
    expect(sesion.getItem("powersystem_sesion_v2")).not.toContain("User123");
  });
  it("rechaza credenciales inválidas", () =>
    expect(() => tienda.ingresar("jperez", "incorrecta")).toThrowError(
      /incorrectos/,
    ));
  it("bloquea tras cinco intentos y permite entrar al vencer el plazo", () => {
    for (let i = 0; i < 5; i++) {
      try {
        tienda.ingresar("jperez", "x");
      } catch {}
    }
    expect(() => cliente()).toThrowError(/intentos/);
    clock += 61000;
    expect(() => cliente()).not.toThrow();
  });
  it("caduca la sesión a los treinta minutos", () => {
    cliente();
    clock += 1800000;
    expect(tienda.sesion()).toBeNull();
  });
  it("cerrar sesión conserva el carrito", () => {
    cliente();
    tienda.agregar("p1");
    tienda.salir();
    expect(tienda.sesion()).toBeNull();
    cliente();
    expect(tienda.carrito(tienda.cargar(), 2).items[0].cantidad).toBe(1);
  });
  it("impide CRUD a un cliente", () => {
    cliente();
    expect(() => tienda.eliminar("p1")).toThrowError(/rol/);
  });
  it("impide comprar como visitante", () =>
    expect(() => tienda.agregar("p1")).toThrowError(/sesión/));
  it("acumula cantidades sin descontar stock antes de confirmar", () => {
    cliente();
    tienda.agregar("p1");
    tienda.agregar("p1");
    expect(tienda.carrito(tienda.cargar(), 2).items[0].cantidad).toBe(2);
    expect(tienda.cargar().productos[0].stock).toBe(8);
  });
  it("rechaza cantidades superiores al stock y fraccionarias", () => {
    cliente();
    tienda.agregar("p1");
    expect(() => tienda.cambiarCantidad("p1", 9)).toThrow();
    expect(() => tienda.cambiarCantidad("p1", 1.5)).toThrow();
  });
  it("rechaza agregar equipos agotados", () => {
    cliente();
    expect(() => tienda.agregar("p6")).toThrowError(/unidades/);
  });
  it("quita un ítem del carrito", () => {
    cliente();
    tienda.agregar("p1");
    tienda.quitar("p1");
    expect(tienda.carrito(tienda.cargar(), 2).items).toEqual([]);
  });
  it("valida duración entera entre uno y 365", () => {
    cliente();
    for (const n of [0, 366, 2.5]) expect(() => tienda.dias(n)).toThrow();
  });
  it("calcula dos equipos por 15000 durante tres días como 90000", () => {
    const a = comprar();
    expect(a.total).toBe(90000);
    expect(a.items[0].subtotal).toBe(90000);
  });
  it("confirma, descuenta stock y vacía el carrito", () => {
    comprar();
    const db = tienda.cargar();
    expect(db.productos[0].stock).toBe(6);
    expect(db.arriendos.length).toBe(1);
    expect(db.carritos[2].items).toEqual([]);
  });
  it("un segundo envío no duplica el arriendo", () => {
    comprar();
    expect(() => tienda.finalizar(entrega())).toThrowError(/vacío/);
    expect(tienda.cargar().arriendos.length).toBe(1);
  });
  it("pago rechazado no cambia stock, historial ni carrito", () => {
    cliente();
    tienda.agregar("p1");
    const antes = local.getItem("powersystem_db_v2");
    expect(() =>
      tienda.finalizar({ ...entrega(), resultado: "rechazado" }),
    ).toThrowError(/rechazado/);
    expect(local.getItem("powersystem_db_v2")).toBe(antes);
  });
  it("revalida stock modificado antes de comprar", () => {
    cliente();
    tienda.agregar("p1");
    admin();
    tienda.guardarProducto({ ...tienda.cargar().productos[0], stock: 0 }, "p1");
    tienda.salir();
    cliente();
    expect(() => tienda.finalizar(entrega())).toThrowError(/disponibilidad/);
    expect(tienda.cargar().arriendos.length).toBe(0);
  });
  it("impide comprar un producto retirado", () => {
    cliente();
    tienda.agregar("p1");
    admin();
    tienda.eliminar("p1");
    tienda.salir();
    cliente();
    expect(() => tienda.finalizar(entrega())).toThrowError(/retirado/);
  });
  it("separa carritos entre usuarios", () => {
    cliente();
    tienda.agregar("p1");
    tienda.salir();
    tienda.ingresar("mrojas", "User123");
    expect(tienda.carrito(tienda.cargar(), 3).items).toEqual([]);
  });
  it("crea, edita y elimina un equipo", () => {
    admin();
    const p = {
      codigo: "TEST-1",
      nombre: "Equipo prueba",
      descripcion: "Prueba",
      categoria: "Redes",
      precio: 5000,
      stock: 2,
      activo: true,
    };
    tienda.guardarProducto(p);
    let x = tienda.cargar().productos.find((p) => p.codigo === "TEST-1");
    tienda.guardarProducto({ ...x, precio: 6000 }, x.id);
    expect(tienda.cargar().productos.find((p) => p.id === x.id).precio).toBe(
      6000,
    );
    tienda.eliminar(x.id);
    expect(tienda.cargar().productos.length).toBe(6);
  });
  it("rechaza código duplicado y precio negativo", () => {
    admin();
    const p = tienda.cargar().productos[0];
    expect(() => tienda.guardarProducto(p)).toThrowError(/código/);
    expect(() =>
      tienda.guardarProducto({ ...p, precio: -1 }, p.id),
    ).toThrowError(/Precio/);
  });
  it("rechaza descuento fuera de rango e imagen externa", () => {
    admin();
    const p = tienda.cargar().productos[0];
    expect(() =>
      tienda.guardarProducto({ ...p, descuento: 81 }, p.id),
    ).toThrow();
    expect(() =>
      tienda.guardarProducto({ ...p, imagen: "https://x.test/a.jpg" }, p.id),
    ).toThrow();
  });
  it("conserva precio histórico después de editar el catálogo", () => {
    comprar();
    admin();
    tienda.guardarProducto(
      { ...tienda.cargar().productos[0], precio: 1 },
      "p1",
    );
    expect(tienda.cargar().arriendos[0].total).toBe(90000);
  });
  it("devuelve stock una sola vez", () => {
    const a = comprar();
    admin();
    tienda.devolver(a.id);
    expect(tienda.cargar().productos[0].stock).toBe(8);
    expect(() => tienda.devolver(a.id)).toThrow();
    expect(tienda.cargar().productos[0].stock).toBe(8);
  });
  it("devolver no recrea productos eliminados", () => {
    const a = comprar();
    admin();
    tienda.eliminar("p1");
    tienda.devolver(a.id);
    expect(tienda.cargar().productos.some((p) => p.id === "p1")).toBeFalse();
    expect(tienda.cargar().arriendos[0].items[0].nombre).toBe(
      "Lenovo ThinkPad E14",
    );
  });
  it("aplica descuento al precio efectivo", () =>
    expect(tarifa({ precio: 22000, descuento: 10 })).toBe(19800));
  it("valida contacto, entrega y consentimiento", () => {
    expect(() => validarEntrega(entrega())).not.toThrow();
    for (const d of [
      { nombre: "" },
      { email: "mal" },
      { direccion: "x" },
      { comuna: "" },
      { metodo: "x" },
      { resultado: "x" },
      { aceptado: false },
    ])
      expect(() => validarEntrega({ ...entrega(), ...d })).toThrow();
  });
});

let host, root;
async function render(ui, { route = "/", provider = false } = {}) {
  await act(async () =>
    root.render(
      <MemoryRouter initialEntries={[route]}>
        {provider ? (
          <TiendaProvider servicio={tienda}>{ui}</TiendaProvider>
        ) : (
          ui
        )}
      </MemoryRouter>,
    ),
  );
}
async function click(el) {
  await act(async () => el.click());
}
async function input(el, value) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    ).set.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
async function submit(el) {
  await act(async () =>
    el.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
  );
}
describe("Componentes React y DOM", () => {
  beforeEach(() => {
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
  });
  afterEach(async () => {
    await act(async () => root.unmount());
    host.remove();
  });
  it("tarjeta muestra nombre, precio y props", async () => {
    await render(
      <ProductCard
        producto={tienda.cargar().productos[0]}
        onAgregar={() => {}}
      />,
    );
    expect(host.textContent).toContain("Lenovo ThinkPad E14");
    expect(host.textContent).toContain("15.000");
  });
  it("clic llama callback con identificador", async () => {
    const spy = jasmine.createSpy("agregar");
    await render(
      <ProductCard producto={tienda.cargar().productos[0]} onAgregar={spy} />,
    );
    await click(host.querySelector("button"));
    expect(spy).toHaveBeenCalledWith("p1");
  });
  it("equipo agotado deshabilita la acción", async () => {
    await render(
      <ProductCard
        producto={tienda.cargar().productos[5]}
        onAgregar={() => {}}
      />,
    );
    expect(host.querySelector("button").disabled).toBeTrue();
  });
  it("lista renderiza todos los elementos", async () => {
    await render(
      <ListaProductos
        productos={tienda.cargar().productos}
        onAgregar={() => {}}
      />,
    );
    expect(host.querySelectorAll("article").length).toBe(6);
  });
  it("mensaje de error solo aparece si existe texto", async () => {
    await render(<Mensaje />);
    expect(host.querySelector("[role=alert]")).toBeNull();
    await render(<Mensaje texto="Error de prueba" />);
    expect(host.querySelector("[role=alert]").textContent).toBe(
      "Error de prueba",
    );
  });
  it("React presenta contenido HTML ingresado como texto", async () => {
    await render(
      <ProductCard
        producto={{
          ...tienda.cargar().productos[0],
          nombre: "<img src=x onerror=alert(1)>",
        }}
        onAgregar={() => {}}
      />,
    );
    expect(host.querySelectorAll("img").length).toBe(0);
    expect(host.textContent).toContain("<img");
  });
  it("checkout precarga datos recibidos en props", async () => {
    await render(<CheckoutForm inicial={entrega()} onConfirmar={() => {}} />);
    expect(host.querySelector("#nombre").value).toBe("Cliente Prueba");
  });
  it("checkout actualiza estado al escribir y envía valores al callback", async () => {
    const spy = jasmine.createSpy("confirmar");
    await render(<CheckoutForm inicial={entrega()} onConfirmar={spy} />);
    await input(host.querySelector("#nombre"), "Ana Prueba");
    await click(host.querySelector("#aceptado"));
    await submit(host.querySelector("form"));
    expect(spy.calls.mostRecent().args[0].nombre).toBe("Ana Prueba");
    expect(spy.calls.mostRecent().args[0].aceptado).toBeTrue();
  });
  it("checkout muestra errores del servicio simulado", async () => {
    await render(
      <CheckoutForm
        inicial={entrega()}
        onConfirmar={() => {
          throw Error("Stock cambió");
        }}
      />,
    );
    await submit(host.querySelector("form"));
    expect(host.querySelector("[role=alert]").textContent).toBe("Stock cambió");
  });
  it("formulario de producto convierte números y preserva cambios", async () => {
    const spy = jasmine.createSpy("guardar");
    await render(
      <ProductForm
        original={tienda.cargar().productos[0]}
        onGuardar={spy}
        onCancelar={() => {}}
      />,
    );
    await input(host.querySelector("#precio"), "19000");
    await submit(host.querySelector("form"));
    expect(spy.calls.mostRecent().args[0].precio).toBe(19000);
  });
  it("catálogo filtra al escribir sin recargar la página", async () => {
    await render(<Catalogo />, { provider: true });
    await input(host.querySelector("#buscar"), "router");
    expect(host.querySelectorAll("article").length).toBe(1);
    expect(host.textContent).toContain("Router WiFi");
  });
  it("catálogo muestra estado vacío sin coincidencias", async () => {
    await render(<Catalogo />, { provider: true });
    await input(host.querySelector("#buscar"), "zzzz");
    expect(host.textContent).toContain("No hay resultados");
  });
  it("ofertas solo muestra productos con descuento", async () => {
    await render(<Catalogo ofertas />, { provider: true });
    expect(host.querySelectorAll("article").length).toBe(2);
  });
  it("carrito presenta cálculo y permite quitar un producto", async () => {
    cliente();
    tienda.agregar("p1");
    await render(<Carrito />, { provider: true });
    expect(host.textContent).toContain("15.000");
    await click(
      [...host.querySelectorAll("button")].find(
        (b) => b.textContent === "Quitar",
      ),
    );
    expect(host.textContent).toContain("Tu carrito está vacío");
  });
  it("historial de otro usuario no muestra pedidos ajenos", async () => {
    comprar();
    tienda.salir();
    tienda.ingresar("mrojas", "User123");
    await render(<Arriendos />, { provider: true });
    expect(host.querySelectorAll("details").length).toBe(0);
  });
  it("administrador ve pedidos y puede confirmar devolución", async () => {
    comprar();
    admin();
    await render(<Arriendos />, { provider: true });
    expect(host.querySelectorAll("details").length).toBe(1);
    await click(
      [...host.querySelectorAll("button")].find(
        (b) => b.textContent === "Registrar devolución",
      ),
    );
    await click(
      [...host.querySelectorAll("button")].find(
        (b) => b.textContent === "Confirmar devolución",
      ),
    );
    expect(host.textContent).toContain("Devuelto");
  });
  it("administración abre y cancela formulario de creación", async () => {
    admin();
    await render(<Admin />, { provider: true });
    await click(
      [...host.querySelectorAll("button")].find(
        (b) => b.textContent === "Agregar equipo",
      ),
    );
    expect(host.querySelector("form")).not.toBeNull();
    await click(
      [...host.querySelectorAll("button")].find(
        (b) => b.textContent === "Cancelar",
      ),
    );
    expect(host.querySelector("form")).toBeNull();
  });
  it("login informa credenciales inválidas", async () => {
    await render(<Login />, { provider: true });
    await input(host.querySelector("#usuario"), "jperez");
    await input(host.querySelector("#clave"), "incorrecta");
    await submit(host.querySelector("form"));
    expect(host.textContent).toContain("Usuario o contraseña incorrectos");
  });
  it("ruta administrativa rechaza a visitante", async () => {
    await render(<App />, { provider: true, route: "/admin" });
    expect(host.querySelector("#usuario")).not.toBeNull();
    expect(host.textContent).not.toContain("Catálogo de equipos");
  });
  it("navegación móvil cambia el estado aria expanded", async () => {
    await render(<App />, { provider: true });
    const btn = host.querySelector(".navbar-toggler");
    expect(btn.getAttribute("aria-expanded")).toBe("false");
    await click(btn);
    expect(btn.getAttribute("aria-expanded")).toBe("true");
  });
  it("ruta inexistente ofrece recuperación", async () => {
    await render(<App />, { provider: true, route: "/no-existe" });
    expect(host.textContent).toContain("Página no encontrada");
  });
  it("detalle muestra el equipo correspondiente", async () => {
    await render(<App />, { provider: true, route: "/producto/p1" });
    expect(host.querySelector("h1").textContent).toBe("Lenovo ThinkPad E14");
  });
  it("categorías muestra enlaces navegables", async () => {
    await render(<Categorias />, { provider: true });
    const enlaces = [...host.querySelectorAll(".category-tile")];
    const categorias = ["Computación", "Audiovisual", "Redes", "Accesorios", "Oficina y Papelería"];
    expect(enlaces.length).toBe(categorias.length);
    for (const categoria of categorias) {
      const enlace = enlaces.find((a) => a.querySelector("h2").textContent === `${categoria} ↗`);
      expect(enlace).toBeDefined();
      expect(enlace?.getAttribute("href")).toBe(`/catalogo?categoria=${encodeURIComponent(categoria)}`);
    }
  });
});

describe("Valor base por unidad", () => {
  it("suma bases individuales, días y cantidades y conserva el historial", () => {
    admin();
    const p = tienda.cargar().productos[0];
    tienda.guardarProducto({ ...p, precio: 30000, valorBase: 200000 }, p.id);
    const p2 = tienda.cargar().productos[1];
    tienda.guardarProducto({ ...p2, precio: 60000, valorBase: 300000 }, p2.id);
    tienda.salir();
    cliente();
    tienda.agregar(p.id);
    tienda.agregar(p.id);
    tienda.agregar(p2.id);
    tienda.dias(3);
    const pedido = tienda.finalizar(entrega());
    expect(pedido.total).toBe(1060000);
    expect(pedido.items[0].subtotal).toBe(580000);
    admin();
    tienda.guardarProducto({ ...p, valorBase: 1 }, p.id);
    expect(tienda.cargar().arriendos[0].items[0].valorBase).toBe(200000);
  });
  it("rechaza bases negativas y fraccionarias", () => {
    admin();
    const p = tienda.cargar().productos[0];
    for (const valorBase of [-1, 1.5, NaN]) {
      expect(() =>
        tienda.guardarProducto({ ...p, valorBase }, p.id),
      ).toThrowError(/valor base/);
    }
  });
});
