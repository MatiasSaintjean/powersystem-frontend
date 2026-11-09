import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles.css";
import App from "./App";
import { TiendaProvider } from "./context";

// HashRouter permite abrir las rutas también en hosting estático como GitHub Pages.
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HashRouter>
      <TiendaProvider>
        <App />
      </TiendaProvider>
    </HashRouter>
  </React.StrictMode>,
);
