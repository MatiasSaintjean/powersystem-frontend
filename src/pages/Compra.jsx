import { useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTienda } from "../context";
import {
  Campo,
  Mensaje,
  Resumen,
  Vacio,
  dinero,
  fecha,
} from "../components/UI";

export function Carrito() {
  const { db, usuario, tienda, ejecutar } = useTienda();
  const c = tienda.carrito(db, usuario.id);
  let items = [],
    error = "";
  try {
    if (c.items.length) items = tienda.cotizar(db, c);
  } catch (e) {
    error = e.message;
  }
  function cambiar(fn) {
    try {
      ejecutar(fn);
    } catch {
      /* error visible en contexto */
    }
  }
  if (!c.items.length)
    return (
      <Vacio
        titulo="Tu carrito está vacío"
        texto="Agrega los equipos que necesitas para tu proyecto."
      />
    );
  return (
    <>
      <h1>Tu carrito</h1>
      <p className="lead">Ajusta cantidades y días antes de confirmar.</p>
      <div className="row g-4">
        <div className="col-lg-8">
          <div className="panel mb-4">
            <Campo
              id="dias"
              label="Duración del arriendo en días"
              type="number"
              min="1"
              max="365"
              value={c.dias}
              onChange={(e) =>
                cambiar(() => tienda.dias(Number(e.target.value)))
              }
            />
            <small>
              De 1 a 365 días completos desde la confirmación. La devolución se
              registra manualmente.
            </small>
          </div>
          {c.items.map((i) => {
            const p = db.productos.find((p) => p.id === i.id);
            return (
              <article className="panel mb-3" key={i.id}>
                <h2 className="h5">{p?.nombre || "Equipo eliminado"}</h2>
                {!p?.activo && (
                  <Mensaje texto="Este equipo fue retirado. Quítalo del carrito para continuar." />
                )}
                <div className="d-flex align-items-end justify-content-between flex-wrap gap-3">
                  <Campo
                    id={`cantidad-${i.id}`}
                    label="Cantidad"
                    type="number"
                    min="1"
                    max={p?.stock || 1}
                    value={i.cantidad}
                    onChange={(e) =>
                      cambiar(() =>
                        tienda.cambiarCantidad(i.id, Number(e.target.value)),
                      )
                    }
                  />
                  <p>{p?.stock || 0} disponibles</p>
                  <button
                    className="btn btn-outline-danger mb-3"
                    onClick={() => cambiar(() => tienda.quitar(i.id))}
                  >
                    Quitar
                  </button>
                </div>
              </article>
            );
          })}
        </div>
        <div className="col-lg-4">
          <Mensaje texto={error} />
          <Resumen
            items={items}
            dias={c.dias}
            total={items.reduce((s, i) => s + i.subtotal, 0)}
          />
          {!error && (
            <Link className="btn btn-primary w-100 mt-3" to="/checkout">
              Continuar con el arriendo
            </Link>
          )}
        </div>
      </div>
    </>
  );
}

// Formulario controlado: React conserva los valores y entrega un objeto al padre.
export function CheckoutForm({ inicial = {}, onConfirmar }) {
  const [d, setD] = useState({
    nombre: inicial.nombre || "",
    email: inicial.email || "",
    direccion: inicial.direccion || "",
    comuna: inicial.comuna || "",
    metodo: "retiro",
    resultado: "aprobado",
    aceptado: false,
  });
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const pendiente = useRef(false);
  const valor = (k, v) => setD((x) => ({ ...x, [k]: v }));
  async function enviar(e) {
    e.preventDefault();
    if (pendiente.current) return;
    pendiente.current = true;
    setOcupado(true);
    setError("");
    try {
      await onConfirmar(d);
    } catch (e) {
      setError(e.message);
    } finally {
      pendiente.current = false;
      setOcupado(false);
    }
  }
  return (
    <form className="panel" onSubmit={enviar}>
      <h2 className="h4">Datos de contacto y entrega</h2>
      <p>Usa datos ficticios para la demostración.</p>
      <Mensaje texto={error} />
      <Campo
        id="nombre"
        label="Nombre completo"
        value={d.nombre}
        required
        minLength="3"
        maxLength="80"
        onChange={(e) => valor("nombre", e.target.value)}
      />
      <Campo
        id="email"
        label="Correo electrónico"
        type="email"
        required
        value={d.email}
        onChange={(e) => valor("email", e.target.value)}
      />
      <Campo
        id="direccion"
        label="Dirección de contacto o despacho"
        required
        minLength="5"
        maxLength="160"
        value={d.direccion}
        onChange={(e) => valor("direccion", e.target.value)}
      />
      <Campo
        id="comuna"
        label="Comuna"
        required
        minLength="2"
        maxLength="80"
        value={d.comuna}
        onChange={(e) => valor("comuna", e.target.value)}
      />
      <label htmlFor="metodo" className="form-label">
        Opción de entrega
      </label>
      <select
        id="metodo"
        className="form-select mb-3"
        value={d.metodo}
        onChange={(e) => valor("metodo", e.target.value)}
      >
        <option value="retiro">Retiro coordinado</option>
        <option value="despacho">Despacho simulado sin costo</option>
      </select>
      <fieldset className="border-top pt-3">
        <legend className="h5">Pago de demostración</legend>
        <p className="small">No se solicitan tarjetas ni se efectúan cobros.</p>
        <label htmlFor="resultado" className="form-label">
          Resultado del pago simulado
        </label>
        <select
          id="resultado"
          className="form-select mb-3"
          value={d.resultado}
          onChange={(e) => valor("resultado", e.target.value)}
        >
          <option value="aprobado">Aprobado</option>
          <option value="rechazado">
            Rechazado para probar el flujo de error
          </option>
        </select>
        <div className="form-check mb-3">
          <input
            className="form-check-input"
            type="checkbox"
            id="aceptado"
            checked={d.aceptado}
            required
            onChange={(e) => valor("aceptado", e.target.checked)}
          />
          <label htmlFor="aceptado" className="form-check-label">
            Confirmo que se trata de un pago simulado
          </label>
        </div>
      </fieldset>
      <button className="btn btn-primary w-100" disabled={ocupado}>
        {ocupado ? "Procesando…" : "Confirmar arriendo simulado"}
      </button>
    </form>
  );
}
export function Checkout() {
  const { usuario, db, tienda, ejecutar, setAviso } = useTienda();
  const ir = useNavigate();
  const c = tienda.carrito(db, usuario.id);
  let items, error;
  try {
    items = tienda.cotizar(db, c);
  } catch (e) {
    error = e.message;
  }
  if (error)
    return (
      <Vacio
        titulo="Revisa tu carrito"
        texto={error}
        destino="/carrito"
        accion="Volver al carrito"
      />
    );
  function confirmar(d) {
    try {
      const a = ejecutar(() => tienda.finalizar(d));
      ir(`/resultado/exito/${a.id}`, { replace: true });
    } catch (e) {
      if (d.resultado === "rechazado") {
        setAviso(null);
        ir("/resultado/error");
      } else throw e;
    }
  }
  return (
    <>
      <h1>Confirma tu arriendo</h1>
      <div className="row g-4">
        <div className="col-lg-7">
          <CheckoutForm inicial={usuario} onConfirmar={confirmar} />
        </div>
        <div className="col-lg-5">
          <Resumen
            items={items}
            dias={c.dias}
            total={items.reduce((s, i) => s + i.subtotal, 0)}
          />
        </div>
      </div>
    </>
  );
}
export function Resultado() {
  const { estado, id } = useParams();
  const { db, usuario } = useTienda();
  const a = db.arriendos.find((a) => a.id === id && a.usuarioId === usuario.id);
  if (estado === "error")
    return (
      <Vacio
        titulo="El pago simulado fue rechazado"
        texto="No se creó un arriendo ni se descontó stock. Tu carrito conserva los equipos para volver a intentarlo."
        destino="/checkout"
        accion="Volver a intentar"
      />
    );
  if (!a) return <Vacio titulo="Arriendo no encontrado" />;
  return (
    <>
      <p className="eyebrow">CONFIRMACIÓN</p>
      <h1>Tu arriendo está confirmado</h1>
      <p>
        Código <strong>{a.id}</strong> · {fecha(a.inicio)} a {fecha(a.fin)}
      </p>
      <Resumen items={a.items} dias={a.dias} total={a.total} />
      <Link className="btn btn-primary mt-4" to="/arriendos">
        Consultar mis arriendos
      </Link>
    </>
  );
}

export function Arriendos() {
  const { db, usuario, tienda, ejecutar } = useTienda();
  const [devolver, setDevolver] = useState(null);
  const lista = db.arriendos.filter(
    (a) => usuario.rol === "admin" || a.usuarioId === usuario.id,
  );
  function confirmar() {
    try {
      ejecutar(
        () => tienda.devolver(devolver),
        "Devolución registrada. Stock repuesto.",
      );
      setDevolver(null);
    } catch {
      setDevolver(null);
    }
  }
  return (
    <>
      <h1>
        {usuario.rol === "admin" ? "Todos los arriendos" : "Mis arriendos"}
      </h1>
      <p className="lead">Consulta equipos, períodos y estados.</p>
      {devolver && (
        <section
          className="panel mb-4"
          role="alertdialog"
          aria-label="Confirmar devolución"
        >
          <p>¿Confirmas la recepción de los equipos del arriendo {devolver}?</p>
          <button className="btn btn-primary me-2" onClick={confirmar}>
            Confirmar devolución
          </button>
          <button
            className="btn btn-outline-secondary"
            onClick={() => setDevolver(null)}
          >
            Cancelar
          </button>
        </section>
      )}
      {!lista.length ? (
        <Vacio titulo="Aún no hay arriendos" />
      ) : (
        lista.map((a) => (
          <details className="panel mb-3" key={a.id}>
            <summary className="d-flex flex-wrap gap-3">
              <strong>{a.id}</strong>
              <span>{fecha(a.inicio)}</span>
              <span className="badge text-bg-success">{a.estado}</span>
              <strong>{dinero(a.total)}</strong>
              <span>Ver detalle</span>
            </summary>
            <div className="pt-4">
              <p>
                Cliente: {a.cliente} · {a.dias} días · Hasta {fecha(a.fin)}
              </p>
              <p>
                Entrega: {a.entrega?.metodo} · {a.entrega?.direccion},{" "}
                {a.entrega?.comuna}
              </p>
              <div className="table-responsive">
                <table className="table">
                  <caption>Equipos del arriendo {a.id}</caption>
                  <thead>
                    <tr>
                      <th>Equipo</th>
                      <th>Cantidad</th>
                      <th>Tarifa diaria</th>
                      <th>Base por unidad</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {a.items.map((i) => (
                      <tr key={i.id}>
                        <td>
                          {i.nombre}
                          <small className="d-block">{i.codigo}</small>
                        </td>
                        <td>{i.cantidad}</td>
                        <td>{dinero(i.precio)}</td>
                        <td>{dinero(i.valorBase ?? 0)}</td>
                        <td>{dinero(i.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {usuario.rol === "admin" && a.estado === "Confirmado" && (
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => setDevolver(a.id)}
                >
                  Registrar devolución
                </button>
              )}
            </div>
          </details>
        ))
      )}
    </>
  );
}
