import { useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useTienda } from "../context";
import {
  ArteEquipo,
  Campo,
  ListaProductos,
  Vacio,
  dinero,
} from "../components/UI";
import { tarifa } from "../data/tienda";
export function useAgregar() {
  const { tienda, usuario, ejecutar } = useTienda();
  const ir = useNavigate();
  return (id) => {
    if (!usuario) {
      ir("/login");
      return;
    }
    try {
      ejecutar(() => tienda.agregar(id), "Equipo agregado al carrito.");
    } catch {
      /* El contexto presenta el error. */
    }
  };
}
export function Inicio() {
  const { db, usuario } = useTienda();
  const agregar = useAgregar();
  return (
    <>
      <section className="row align-items-center g-5 hero">
        <div className="col-lg-7">
          <p className="eyebrow">TECNOLOGÍA A TU RITMO</p>
          <h1>
            El equipo que necesitas.
            <br />
            <em>Por el tiempo que lo necesitas.</em>
          </h1>
          <p className="lead">
            Tecnología para tus proyectos, reuniones y eventos. Elige tus
            equipos y arma tu próximo arriendo.
          </p>
          <div className="d-flex flex-wrap gap-3 mt-4">
            <Link className="btn btn-primary" to="/catalogo">
              Explorar equipos ↗
            </Link>
            <Link className="btn btn-outline-secondary" to="/categorias">
              Ver categorías
            </Link>
          </div>
          <p className="small mt-4">
            Tarifas por día · Valores en pesos chilenos
          </p>
        </div>
        <div className="col-lg-5">
          <aside className="hero-panel">
            <p className="eyebrow">POWERSYSTEM / ARRIENDOS</p>
            <h2>Tu próximo proyecto empieza aquí.</h2>
            <ol>
              <li>Elige tus equipos</li>
              <li>Define cantidades y días</li>
              <li>Confirma y revisa tu arriendo</li>
            </ol>
            <Link to="/ofertas">Explorar ofertas →</Link>
          </aside>
        </div>
      </section>
      <section>
        <div className="d-flex justify-content-between flex-wrap gap-3 mb-4">
          <h2>Listos para tu próxima idea</h2>
          <Link to="/catalogo">Ver todo el catálogo →</Link>
        </div>
        <ListaProductos
          productos={db.productos
            .filter((p) => p.activo && p.stock)
            .slice(0, 3)}
          onAgregar={agregar}
          admin={usuario?.rol === "admin"}
        />
      </section>
    </>
  );
}
export function Catalogo({ ofertas = false }) {
  const { db, usuario } = useTienda();
  const agregar = useAgregar();
  const [params, setParams] = useSearchParams();
  const [busqueda, setBusqueda] = useState("");
  const categoria = params.get("categoria") || "";
  const categorias = [
    ...new Set(db.productos.filter((p) => p.activo).map((p) => p.categoria)),
  ].sort();
  const lista = db.productos.filter(
    (p) =>
      p.activo &&
      (!ofertas || p.descuento > 0) &&
      (!categoria || p.categoria === categoria) &&
      `${p.codigo} ${p.nombre} ${p.categoria}`
        .toLowerCase()
        .includes(busqueda.trim().toLowerCase()),
  );
  return (
    <>
      <p className="eyebrow">EQUIPAMIENTO</p>
      <h1>
        {ofertas ? "Ofertas para tu proyecto" : "Encuentra tu próximo equipo"}
      </h1>
      <p className="lead">
        Elige tecnología por categoría, disponibilidad y tarifa diaria.
      </p>
      <div className="row mt-4">
        <div className="col-md-8">
          <Campo
            id="buscar"
            label="Buscar equipo"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Nombre, código o categoría"
          />
        </div>
        <div className="col-md-4">
          <label htmlFor="categoria" className="form-label">
            Categoría
          </label>
          <select
            id="categoria"
            className="form-select"
            value={categoria}
            onChange={(e) =>
              setParams(e.target.value ? { categoria: e.target.value } : {})
            }
          >
            <option value="">Todas las categorías</option>
            {categorias.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
      <p aria-live="polite">{lista.length} equipos encontrados</p>
      <ListaProductos
        productos={lista}
        onAgregar={agregar}
        admin={usuario?.rol === "admin"}
      />
    </>
  );
}
export function Categorias() {
  const { db } = useTienda();
  const cats = [
    "Computación",
    "Audiovisual",
    "Redes",
    "Accesorios",
    "Oficina y Papelería",
  ];
  return (
    <>
      <h1>Tecnología para cada necesidad</h1>
      <p className="lead">Explora las categorías de PowerSystem.</p>
      <div className="row g-4 mt-2">
        {cats.map((c, i) => (
          <div className="col-md-6" key={c}>
            <Link
              className="panel category-tile d-block"
              to={`/catalogo?categoria=${encodeURIComponent(c)}`}
            >
              <span className="eyebrow">0{i + 1}</span>
              <h2>{c} ↗</h2>
              <p>
                {
                  db.productos.filter((p) => p.activo && p.categoria === c)
                    .length
                }{" "}
                equipos en el catálogo
              </p>
            </Link>
          </div>
        ))}
      </div>
    </>
  );
}
export function Detalle() {
  const { id } = useParams();
  const { db, usuario } = useTienda();
  const agregar = useAgregar();
  const p = db.productos.find((p) => p.id === id && p.activo);
  if (!p)
    return (
      <Vacio
        titulo="Equipo no disponible"
        texto="El producto fue retirado o el enlace no existe."
      />
    );
  return (
    <>
      <Link to="/catalogo">← Volver al catálogo</Link>
      <div className="row g-5 mt-2">
        <div className="col-md-6">
          <ArteEquipo producto={p} />
        </div>
        <div className="col-md-6">
          <p className="eyebrow">
            {p.categoria} / {p.codigo}
          </p>
          <h1>{p.nombre}</h1>
          <p className="lead">{p.descripcion}</p>
          {p.descuento > 0 && (
            <p>
              Oferta de demostración: {p.descuento}% de descuento. Tarifa normal{" "}
              <del>{dinero(p.precio)}</del>.
            </p>
          )}
          <p className="price">
            {dinero(tarifa(p))} <small>por día</small>
          </p>
          <p>{p.stock} unidades disponibles</p>
          {usuario?.rol === "admin" ? (
            <Link className="btn btn-primary" to="/admin">
              Gestionar equipo
            </Link>
          ) : (
            <button
              className="btn btn-primary"
              disabled={!p.stock}
              onClick={() => agregar(id)}
            >
              Agregar al carrito
            </button>
          )}
          <p className="small mt-4">
            Arriendos de 1 a 365 días. El carrito no reserva unidades. El
            período comienza al confirmar.
          </p>
        </div>
      </div>
    </>
  );
}
