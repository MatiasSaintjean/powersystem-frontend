import { Link } from "react-router-dom";
import { tarifa } from "../data/tienda";
export const dinero = (n) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(n);
export const fecha = (s) => new Date(s).toLocaleDateString("es-CL");
export function Mensaje({ texto, tipo = "danger" }) {
  return texto ? (
    <div
      className={`alert alert-${tipo}`}
      role={tipo === "danger" ? "alert" : "status"}
    >
      {texto}
    </div>
  ) : null;
}
export function Vacio({
  titulo = "No hay resultados",
  texto = "Prueba otra selección.",
  destino = "/catalogo",
  accion = "Explorar equipos",
}) {
  return (
    <div className="empty">
      <h2>{titulo}</h2>
      <p>{texto}</p>
      <Link className="btn btn-primary" to={destino}>
        {accion}
      </Link>
    </div>
  );
}
export function Campo({ id, label, error, ...props }) {
  return (
    <div className="mb-3">
      <label className="form-label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className={`form-control ${error ? "is-invalid" : ""}`}
        {...props}
      />
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  );
}
export function ArteEquipo({ producto }) {
  if (producto.imagen)
    return (
      <img
        className="product-photo"
        src={`${import.meta.env.BASE_URL}${producto.imagen.replace(/^\//, "")}`}
        alt={producto.nombre}
      />
    );
  return (
    <div className="product-art" aria-hidden="true">
      <span>{producto.codigo.split("-")[0]}</span>
      <small>{producto.categoria}</small>
    </div>
  );
}
// Las props desacoplan la tarjeta del almacenamiento: también se puede probar aislada.
export function ProductCard({ producto, onAgregar, admin = false }) {
  return (
    <article className="card product h-100">
      <ArteEquipo producto={producto} />
      <div className="card-body d-flex flex-column">
        <div className="d-flex justify-content-between gap-2">
          <span className="tag">{producto.categoria}</span>
          {producto.descuento > 0 && (
            <span className="badge text-bg-success">
              −{producto.descuento}%
            </span>
          )}
        </div>
        <h2 className="h5 mt-3">
          <Link to={`/producto/${producto.id}`}>{producto.nombre}</Link>
        </h2>
        <p className="text-secondary flex-grow-1">{producto.descripcion}</p>
        {producto.descuento > 0 && (
          <del className="small text-secondary">{dinero(producto.precio)}</del>
        )}
        <p className="price">
          {dinero(tarifa(producto))}
          <small> / día</small>
        </p>
        {producto.valorBase > 0 && (
          <p>Base por unidad: {dinero(producto.valorBase)} (una sola vez)</p>
        )}
        <p className="small">{producto.stock} unidades disponibles</p>
        <div className="d-grid gap-2">
          <Link
            className="btn btn-outline-secondary"
            to={`/producto/${producto.id}`}
          >
            Ver equipo
          </Link>
          {admin ? (
            <Link className="btn btn-primary" to="/admin">
              Gestionar equipo
            </Link>
          ) : (
            <button
              className="btn btn-primary"
              disabled={!producto.stock}
              onClick={() => onAgregar(producto.id)}
            >
              {producto.stock ? "Agregar al carrito" : "Sin disponibilidad"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
export function ListaProductos({ productos, onAgregar, admin }) {
  if (!productos.length) return <Vacio />;
  return (
    <div className="row g-4">
      {productos.map((p) => (
        <div className="col-12 col-md-6 col-xl-4" key={p.id}>
          <ProductCard producto={p} onAgregar={onAgregar} admin={admin} />
        </div>
      ))}
    </div>
  );
}
export function Resumen({ items, dias, total }) {
  return (
    <section className="panel">
      <h2 className="h4">Resumen del arriendo</h2>
      <p>{dias} días de uso</p>
      {items.map((i) => (
        <div className="summary-line" key={i.id}>
          <span>
            {i.nombre} × {i.cantidad}
            <small className="d-block">
              Por unidad: base {dinero(i.valorBase ?? 0)} + {dinero(i.precio)} ×{" "}
              {dias} días
            </small>
          </span>
          <strong>{dinero(i.subtotal)}</strong>
        </div>
      ))}
      <div className="summary-line total">
        <span>Total</span>
        <strong>{dinero(total)}</strong>
      </div>
      <small>Valores finales de demostración. Sin cargos adicionales.</small>
    </section>
  );
}
