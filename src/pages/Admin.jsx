import { useState } from "react";
import { useTienda } from "../context";
import { Campo, Mensaje, dinero } from "../components/UI";

export function ProductForm({ original, onGuardar, onCancelar }) {
  const [d, setD] = useState(
    original || {
      codigo: "",
      nombre: "",
      descripcion: "",
      categoria: "Computación",
      precio: "",
      stock: "",
      descuento: 0,
      activo: true,
      imagen: "",
    },
  );
  const [error, setError] = useState("");
  function valor(k, v) {
    setD((x) => ({ ...x, [k]: v }));
  }
  function enviar(e) {
    e.preventDefault();
    setError("");
    try {
      onGuardar({
        ...d,
        precio: Number(d.precio),
        valorBase: Number(d.valorBase ?? 0),
        stock: Number(d.stock),
        descuento: Number(d.descuento),
      });
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <form className="panel mb-4" onSubmit={enviar}>
      <h2>{original ? "Editar equipo" : "Agregar equipo"}</h2>
      <Mensaje texto={error} />
      <div className="row">
        <div className="col-md-6">
          <Campo
            id="codigo"
            label="Código"
            required
            maxLength="20"
            value={d.codigo}
            onChange={(e) => valor("codigo", e.target.value)}
          />
        </div>
        <div className="col-md-6">
          <Campo
            id="nombre-producto"
            label="Nombre del equipo"
            required
            minLength="3"
            maxLength="80"
            value={d.nombre}
            onChange={(e) => valor("nombre", e.target.value)}
          />
        </div>
      </div>
      <Campo
        id="descripcion"
        label="Descripción"
        required
        maxLength="180"
        value={d.descripcion}
        onChange={(e) => valor("descripcion", e.target.value)}
      />
      <div className="row">
        <div className="col-md-4">
          <Campo
            id="precio"
            label="Tarifa diaria en pesos"
            type="number"
            min="1"
            max="9999999"
            step="1"
            required
            value={d.precio}
            onChange={(e) => valor("precio", e.target.value)}
          />
        </div>
        <div className="col-md-4">
          <Campo
            id="stock"
            label="Unidades disponibles"
            type="number"
            min="0"
            max="9999"
            step="1"
            required
            value={d.stock}
            onChange={(e) => valor("stock", e.target.value)}
          />
        </div>
        <div className="col-md-4">
          <Campo
            id="descuento"
            label="Descuento porcentual"
            type="number"
            min="0"
            max="80"
            step="1"
            required
            value={d.descuento || 0}
            onChange={(e) => valor("descuento", e.target.value)}
          />
        </div>
      </div>
      <Campo
        id="valor-base"
        label="Valor base por unidad (se cobra una sola vez)"
        type="number"
        min="0"
        max="9999999"
        step="1"
        required
        value={d.valorBase ?? 0}
        onChange={(e) => valor("valorBase", e.target.value)}
      />
      <label htmlFor="categoria-admin" className="form-label">
        Categoría
      </label>
      <select
        id="categoria-admin"
        className="form-select mb-3"
        value={d.categoria}
        onChange={(e) => valor("categoria", e.target.value)}
      >
        {[
          "Computación",
          "Audiovisual",
          "Redes",
          "Accesorios",
          "Oficina y Papelería",
        ].map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
      <Campo
        id="imagen"
        label="Imagen local opcional"
        placeholder="/productos/nombre-del-equipo.jpg"
        value={d.imagen || ""}
        onChange={(e) => valor("imagen", e.target.value)}
      />
      <div className="form-check mb-4">
        <input
          className="form-check-input"
          id="activo"
          type="checkbox"
          checked={d.activo}
          onChange={(e) => valor("activo", e.target.checked)}
        />
        <label className="form-check-label" htmlFor="activo">
          Visible en el catálogo
        </label>
      </div>
      <div className="d-flex gap-2">
        <button className="btn btn-primary">Guardar equipo</button>
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={onCancelar}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
export function Admin() {
  const { db, tienda, ejecutar } = useTienda();
  const [edicion, setEdicion] = useState(null);
  const [borrar, setBorrar] = useState(null);
  function guardar(d) {
    ejecutar(() => tienda.guardarProducto(d, edicion.id), "Equipo guardado.");
    setEdicion(null);
  }
  function eliminar() {
    try {
      ejecutar(
        () => tienda.eliminar(borrar.id),
        "Equipo eliminado. Los arriendos anteriores se conservan.",
      );
      setBorrar(null);
    } catch {
      setBorrar(null);
    }
  }
  return (
    <>
      <p className="eyebrow">ADMINISTRACIÓN</p>
      <div className="d-flex justify-content-between flex-wrap gap-3 mb-4">
        <h1>Catálogo de equipos</h1>
        <button
          className="btn btn-primary align-self-start"
          onClick={() => setEdicion({})}
        >
          Agregar equipo
        </button>
      </div>
      <div className="row g-3 mb-4">
        {[
          ["Equipos", db.productos.length],
          ["Visibles", db.productos.filter((p) => p.activo).length],
          [
            "Unidades disponibles",
            db.productos.reduce((s, p) => s + p.stock, 0),
          ],
        ].map(([t, n]) => (
          <div className="col-12 col-sm-4" key={t}>
            <div className="stat">
              {t}
              <strong>{n}</strong>
            </div>
          </div>
        ))}
      </div>
      {edicion && (
        <ProductForm
          key={edicion.id || "nuevo"}
          original={edicion.id ? edicion : null}
          onGuardar={guardar}
          onCancelar={() => setEdicion(null)}
        />
      )}{" "}
      {borrar && (
        <section
          role="alertdialog"
          aria-label="Confirmar eliminación"
          className="panel mb-4"
        >
          <h2 className="h4">¿Eliminar {borrar.nombre}?</h2>
          <p>
            Se retirará del catálogo. El historial anterior conservará sus
            detalles.
          </p>
          <button className="btn btn-danger me-2" onClick={eliminar}>
            Confirmar eliminación
          </button>
          <button
            className="btn btn-outline-secondary"
            onClick={() => setBorrar(null)}
          >
            Cancelar
          </button>
        </section>
      )}
      <div className="table-responsive panel p-0">
        <table className="table align-middle mb-0">
          <caption className="px-3">Inventario local de PowerSystem</caption>
          <thead>
            <tr>
              <th>Equipo</th>
              <th>Categoría</th>
              <th>Tarifa</th>
              <th>Stock</th>
              <th>Visibilidad</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {db.productos.map((p) => (
              <tr key={p.id}>
                <td>
                  <strong>{p.nombre}</strong>
                  <small className="d-block">{p.codigo}</small>
                </td>
                <td>{p.categoria}</td>
                <td>
                  {dinero(p.precio)}
                  {p.descuento > 0 && (
                    <small className="d-block">Oferta −{p.descuento}%</small>
                  )}
                </td>
                <td>{p.stock}</td>
                <td>{p.activo ? "Visible" : "Oculto"}</td>
                <td>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => setEdicion(p)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => setBorrar(p)}
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
