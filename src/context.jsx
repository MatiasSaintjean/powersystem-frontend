import { createContext, useContext, useEffect, useState } from "react";
import { crearTienda } from "./data/tienda";

const Contexto = createContext(null);
export function TiendaProvider({ children, servicio }) {
  const [tienda] = useState(() => servicio || crearTienda());
  const [revision, setRevision] = useState(0);
  const [aviso, setAviso] = useState(null);
  const refrescar = () => setRevision((r) => r + 1);
  // Cambios de otras pestañas y caducidad visual de sesión.
  useEffect(() => {
    window.addEventListener("storage", refrescar);
    const timer = setInterval(refrescar, 15000);
    return () => {
      window.removeEventListener("storage", refrescar);
      clearInterval(timer);
    };
  }, []);
  let db, usuario, error;
  try {
    db = tienda.cargar();
    usuario = tienda.sesion();
  } catch (e) {
    error = e.message;
  }
  function ejecutar(operacion, mensaje) {
    try {
      const resultado = operacion();
      refrescar();
      setAviso(mensaje ? { texto: mensaje, tipo: "success" } : null);
      return resultado;
    } catch (e) {
      setAviso({ texto: e.message, tipo: "danger" });
      throw e;
    }
  }
  if (error)
    return (
      <main className="container py-5">
        <h1>No pudimos abrir los datos locales</h1>
        <p role="alert">{error}</p>
        <p>
          Conserva una copia de los datos antes de reiniciar la demostración.
          Consulta el README.
        </p>
      </main>
    );
  return (
    <Contexto.Provider
      value={{ tienda, db, usuario, revision, aviso, setAviso, ejecutar }}
    >
      {children}
    </Contexto.Provider>
  );
}
export const useTienda = () => useContext(Contexto);
