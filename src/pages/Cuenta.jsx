import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useTienda } from "../context";
import { Campo, Mensaje } from "../components/UI";
export function Login() {
  const { usuario, tienda, ejecutar } = useTienda();
  const ir = useNavigate();
  const [datos, setDatos] = useState({ usuario: "", clave: "" });
  const [error, setError] = useState("");
  if (usuario)
    return (
      <Navigate to={usuario.rol === "admin" ? "/admin" : "/catalogo"} replace />
    );
  function enviar(e) {
    e.preventDefault();
    setError("");
    try {
      const s = ejecutar(() => tienda.ingresar(datos.usuario, datos.clave));
      ir(s.rol === "admin" ? "/admin" : "/catalogo");
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <div className="row g-5 align-items-center">
      <div className="col-lg-6">
        <p className="eyebrow">MI CUENTA</p>
        <h1>
          Tu próximo proyecto.
          <br />
          <em>Todo en un lugar.</em>
        </h1>
        <p className="lead">
          Ingresa para preparar un arriendo y consultar su historial.
        </p>
      </div>
      <div className="col-lg-5 offset-lg-1">
        <form onSubmit={enviar} className="panel">
          <h2>Iniciar sesión</h2>
          <Mensaje texto={error} />
          <Campo
            id="usuario"
            label="Usuario"
            autoComplete="username"
            required
            value={datos.usuario}
            onChange={(e) => setDatos({ ...datos, usuario: e.target.value })}
          />
          <Campo
            id="clave"
            label="Contraseña"
            type="password"
            autoComplete="current-password"
            required
            value={datos.clave}
            onChange={(e) => setDatos({ ...datos, clave: e.target.value })}
          />
          <button className="btn btn-primary w-100">Ingresar</button>
          <div className="demo mt-4">
            <p className="fw-semibold">Cuentas de demostración</p>
            <p>
              Cliente: <code>jperez</code> / <code>User123</code>
            </p>
            <p>
              Otro cliente: <code>mrojas</code> / <code>User123</code>
            </p>
            <p>
              Administrador: <code>admin</code> / <code>Admin123</code>
            </p>
            <small>
              Usa datos ficticios. Acceso local de práctica; no se envían
              credenciales a un servidor.
            </small>
          </div>
        </form>
      </div>
    </div>
  );
}
export function Protegida({ rol, children }) {
  const { usuario } = useTienda();
  if (!usuario) return <Navigate to="/login" replace />;
  if (rol && usuario.rol !== rol) return <Navigate to="/" replace />;
  return children;
}
