# PowerSystem — Frontend React

Proyecto académico de arriendo de tecnología para Desarrollo FullStack II (DSY1104), Evaluación Parcial 2. 

## Ejecutar

Requisitos: Node.js 22.12 o posterior compatible (se verificó Node 24.22.1), npm y Chrome para las pruebas.

```powershell
npm ci
npm run dev
```

Abre la URL indicada por Vite, normalmente `http://127.0.0.1:5173`. No abras `index.html` con doble clic ni uses Live Server sobre el código fuente React.

```powershell
npm run build
npm run preview
```

`build` genera `dist`. `preview` permite revisar esa compilación. `package-lock.json` conserva las versiones verificadas. Bootstrap se instala localmente y no se carga mediante CDN.

## Cuentas ficticias

| Rol | Usuario | Clave |
| --- | --- | --- |
| Administrador | admin | Admin123 |
| Cliente | jperez | User123 |
| Cliente | mrojas | User123 |

La sesión dura 30 minutos. Cinco fallos de acceso bloquean nuevos intentos durante 60 segundos en ese navegador. Son controles educativos: las credenciales están en el código y los datos locales pueden modificarse desde las herramientas del navegador.

## Funciones

- Inicio, categorías, catálogo con filtros, detalle y ofertas.
- Login y navegación según rol.
- Carrito por usuario; cantidades y duración entre 1 y 365 días.
- Checkout con contacto, dirección, comuna y opción de entrega precargados desde la cuenta demo cuando corresponde.
- Pago simulado aprobado o rechazado: el rechazo conserva el carrito y no descuenta stock.
- Confirmación con resumen, historial propio y consulta administrativa.
- Creación, edición, visibilidad, descuento y eliminación de equipos.
- Devolución manual que repone stock una sola vez.
- Menú móvil, grilla Bootstrap, etiquetas de formulario y mensajes accesibles.

## Reglas del negocio

Tarifa efectiva = tarifa diaria × (100 − descuento) / 100, redondeada a pesos enteros. Subtotal = cantidad × [valor base + (tarifa efectiva × días)]. La base se cobra una vez por unidad y no recibe descuento. Todos los equipos comparten duración. Dos impresoras C306 y una C4504 durante tres días suman $1.060.000. El catálogo inicial tiene 14 productos con fotografías y no asigna descuentos; el administrador puede configurarlos.

El período comienza al confirmar. No se reservan fechas futuras ni se cobra dinero. El carrito no reserva stock. Se revalida disponibilidad al confirmar y se guarda catálogo, historial y carrito en una escritura local. Esto no garantiza transacciones concurrentes entre pestañas.

El historial conserva una copia del nombre, código, precio y valor base de cada equipo. Eliminar un equipo no destruye su detalle histórico. Devolver un equipo eliminado no lo recrea. El stock representa disponibilidad actual.

## Persistencia

- `localStorage`: `powersystem_db_v2` y `powersystem_intentos_v2`.
- `sessionStorage`: `powersystem_sesion_v2`.
- Cada origen, perfil y navegador tiene sus propios datos. Cambiar de puerto cambia el origen.
- La versión 2 usa claves distintas de la entrega 1 y no importa automáticamente su historial.
- Para reiniciar exclusivamente la demo V2, elimina esas tres claves desde las herramientas del navegador. Conserva una copia antes si necesitas sus datos.

## Estructura

| Archivo | Responsabilidad |
| --- | --- |
| `src/main.jsx` | Inicio de React, Router y estilos Bootstrap. |
| `src/App.jsx` | Menú, rutas y estructura general. |
| `src/context.jsx` | Estado compartido, acciones y actualización de vistas. |
| `src/data/productos.js` | Catálogo inicial de 14 equipos, imágenes y tarifas. |
| `src/data/tienda.js` | Datos simulados, persistencia, validaciones y reglas. |
| `src/components/UI.jsx` | Tarjetas, campos, mensajes y resumen reutilizables. |
| `src/pages/Catalogo.jsx` | Inicio, filtros, categorías, ofertas y detalle. |
| `src/pages/Cuenta.jsx` | Login y protección educativa de rutas. |
| `src/pages/Compra.jsx` | Carrito, checkout, resultados e historial. |
| `src/pages/Admin.jsx` | Formulario y CRUD de equipos. |
| `tests/index.jsx` | Pruebas Jasmine de reglas y componentes React. |
| `scripts/build-tests.mjs` | Compila JSX e instrumenta código para cobertura. |
| `karma.conf.cjs` | Navegador, Jasmine, reportes y ejecución. |


## Pruebas y cobertura

```powershell
npm test
```

Genera `coverage/index.html`, `coverage/coverage-summary.json` y `coverage/test-results.json`. Abre el HTML para explorar qué ramas y funciones se ejecutaron. `npm run test:watch` mantiene Karma activo; después de modificar fuentes, vuelve a compilar las pruebas o reinicia el comando. La compilación de pruebas no observa cambios de origen por sí sola.

Si Chrome no está en la ubicación habitual:

```powershell
$env:CHROME_BIN = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
npm test
```

También puedes ejecutar `npm run test:manual` y abrir `http://localhost:9876` en tu navegador. En el entorno aislado de verificación fue necesario iniciar Chrome con `KARMA_NO_SANDBOX=1`; no es necesario activarlo en una instalación normal. Esa opción solo modifica el navegador de pruebas, no la app.

El documento Word de testing y los JSON de `documentacion/evidencias` registran la ejecución de entrega. La cobertura se obtiene sobre los módulos transformados desde JSX antes de empaquetar, excluye dependencias, CSS y `main.jsx`. Un porcentaje de cobertura no garantiza ausencia de errores.

## Fotos de productos

Guarda fotos autorizadas dentro de `public/productos`. En el formulario administrativo, el campo de imagen acepta `/productos/nombre.jpg`. Para conservarlas como catálogo inicial en otros equipos, añade esa ruta al producto correspondiente en `src/data/productos.js`. El navegador guarda la ruta, no copia el archivo de imagen. El catálogo inicial incluye las 14 fotografías entregadas para el proyecto.


## Validación de la entrega

55 pruebas aprobadas, sin fallos. Cobertura de líneas: 79,12 %. Compilación de producción correcta. Los seis productos de `tests/productosPrueba.js` son datos aislados de prueba y no reemplazan el catálogo de 14 equipos de la aplicación.

Los documentos ERS y testing se encuentran en `documentacion`.
