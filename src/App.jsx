import { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useTienda } from "./context";
import { Mensaje, Vacio } from "./components/UI";
import { Inicio, Catalogo, Categorias, Detalle } from "./pages/Catalogo";
import { Login, Protegida } from "./pages/Cuenta";
import { Carrito, Checkout, Resultado, Arriendos } from "./pages/Compra";
import { Admin } from "./pages/Admin";

export default function App() {
  const { usuario, db, tienda, aviso, setAviso, ejecutar } = useTienda();
  const [abierto, setAbierto] = useState(false);
  const loc = useLocation();
  const ir = useNavigate();
  useEffect(() => {
    setAbierto(false);
    setAviso(null);
    window.scrollTo(0, 0);
    document.title =
      "PowerSystem | " +
      (loc.pathname === "/" ? "Inicio" : loc.pathname.split("/")[1]);
  }, [loc.pathname]);
  const cantidad = usuario
    ? tienda.carrito(db, usuario.id).items.reduce((s, i) => s + i.cantidad, 0)
    : 0;
  function salir() {
    ejecutar(() => tienda.salir());
    ir("/");
  }
  return (
    <>
      <a className="visually-hidden-focusable skip" href="#contenido">
        Saltar al contenido
      </a>
      <header>
        <nav
          className="navbar navbar-expand-lg container py-3"
          aria-label="Navegación principal"
        >
          <Link className="navbar-brand brand" to="/">
            <span className="brand-mark">P</span>POWER<span>SYSTEM</span>
          </Link>
          <button
            className="navbar-toggler"
            aria-label="Abrir navegación"
            aria-expanded={abierto}
            aria-controls="menu"
            onClick={() => setAbierto(!abierto)}
          >
            <span className="navbar-toggler-icon" />
          </button>
          <div
            id="menu"
            className={`collapse navbar-collapse ${abierto ? "show" : ""}`}
          >
            <div className="navbar-nav ms-auto gap-lg-2 align-items-lg-center">
              <NavLink className="nav-link" to="/" end>
                Inicio
              </NavLink>
              <NavLink className="nav-link" to="/catalogo">
                Equipos
              </NavLink>
              <NavLink className="nav-link" to="/categorias">
                Categorías
              </NavLink>
              <NavLink className="nav-link" to="/ofertas">
                Ofertas
              </NavLink>
              {usuario?.rol === "user" && (
                <NavLink className="nav-link" to="/carrito">
                  Carrito ({cantidad})
                </NavLink>
              )}
              {usuario && (
                <NavLink className="nav-link" to="/arriendos">
                  {usuario.rol === "admin" ? "Arriendos" : "Mis arriendos"}
                </NavLink>
              )}
              {usuario?.rol === "admin" && (
                <NavLink className="nav-link" to="/admin">
                  Administrar
                </NavLink>
              )}
              {usuario ? (
                <>
                  <span className="small text-secondary px-2">
                    {usuario.nombre}
                  </span>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={salir}
                  >
                    Salir
                  </button>
                </>
              ) : (
                <Link className="btn btn-primary ms-lg-2" to="/login">
                  Ingresar
                </Link>
              )}
            </div>
          </div>
        </nav>
      </header>
      <main className="container" id="contenido">
        <Mensaje texto={aviso?.texto} tipo={aviso?.tipo} />
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/categorias" element={<Categorias />} />
          <Route path="/ofertas" element={<Catalogo ofertas />} />
          <Route path="/producto/:id" element={<Detalle />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/carrito"
            element={
              <Protegida rol="user">
                <Carrito />
              </Protegida>
            }
          />
          <Route
            path="/checkout"
            element={
              <Protegida rol="user">
                <Checkout />
              </Protegida>
            }
          />
          <Route
            path="/resultado/:estado/:id?"
            element={
              <Protegida rol="user">
                <Resultado />
              </Protegida>
            }
          />
          <Route
            path="/arriendos"
            element={
              <Protegida>
                <Arriendos />
              </Protegida>
            }
          />
          <Route
            path="/admin"
            element={
              <Protegida rol="admin">
                <Admin />
              </Protegida>
            }
          />
          <Route
            path="*"
            element={
              <Vacio
                titulo="Página no encontrada"
                texto="Elige una sección desde el menú."
              />
            }
          />
        </Routes>
      </main>
      <footer>
        <div className="container d-flex flex-wrap justify-content-between gap-3">
          <Link className="brand" to="/">
            POWERSYSTEM
          </Link>
          <span>Tecnología para tus proyectos.</span>
          <small>Demostración académica · Sin cobros reales</small>
        </div>
      </footer>
    </>
  );
}
