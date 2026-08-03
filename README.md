<p align="center">
  <a href="https://react.dev/" target="_blank">
    <img src="https://img.shields.io/badge/React-19-20232A?logo=react&logoColor=61DAFB" height="38" alt="React 19" />
  </a>
  &nbsp;
  <a href="https://vite.dev/" target="_blank">
    <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=FFD62E" height="38" alt="Vite 8" />
  </a>
</p>

<h1 align="center">Insurances Web</h1>

<p align="center">
  Interfaz web para la gestión de clientes, pólizas, aseguradoras, contactos,
  bienes asegurados, documentos y usuarios.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=20232A" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" alt="Vite 8" />
  <img src="https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white" alt="TypeScript 6" />
  <img src="https://img.shields.io/badge/Node.js-%3E%3D24-5FA04E?logo=nodedotjs&logoColor=white" alt="Node.js 24 o superior" />
</p>

## Descripción

Frontend de **Insurances**, construido como una SPA con React y Vite. Consume
la API de Insurances y ofrece una interfaz adaptada a roles para administrar la
cartera, ejecutar procedimientos guiados y operar sobre documentos.

## Funcionalidades

- Inicio de sesión y rutas protegidas.
- Perfil de usuario y operaciones sensibles con reautenticación.
- Backoffice de usuarios para administradores.
- Catálogos de clientes, aseguradoras, contactos, pólizas, bienes y documentos.
- Fichas de cliente y póliza organizadas por pestañas.
- Procedimientos guiados para altas de clientes y pólizas.
- Formularios con validación por campo y protección frente a cambios sin guardar.
- Carga, previsualización y descarga de documentos.
- Búsqueda, ordenación y paginación de tablas.
- Control de acciones por jerarquía de roles.
- Diseño adaptable y compatible con modo claro u oscuro.

## Tecnologías

| Área | Tecnología |
| --- | --- |
| Interfaz | React 19 |
| Herramienta de desarrollo | Vite 8 |
| Lenguaje | TypeScript 6 |
| Navegación | React Router 7 |
| Pruebas | Vitest, Testing Library y jsdom |
| Validación telefónica | libphonenumber-js |
| Calidad | ESLint |

## Requisitos

- Node.js 24 o superior.
- npm.
- Una instancia accesible de Insurances API.

## Instalación

```bash
git clone git@github.com:aerodinamicat/insurances-fe.git
cd insurances-fe
npm ci
```

## Configuración

Copia la plantilla incluida:

```bash
cp .env.example .env
```

Variables disponibles:

```dotenv
# URL de la API accesible desde el navegador
VITE_API_URL=http://localhost:3001

# URL pública opcional cuando Vite se publica mediante un proxy inverso
WEB_UI_URL=https://insurances-fe-dev.example.com
```

Las variables `VITE_*` se incorporan durante el build y son visibles desde el
navegador; no deben contener secretos.

## Ejecución

```bash
# Servidor de desarrollo con HMR
npm run dev

# Comprobación de tipos y build de producción
npm run build

# Previsualizar el build
npm run preview
```

Vite sirve la aplicación en `http://localhost:5173` de forma predeterminada.
Cuando se ejecuta mediante la configuración Compose del proyecto, el puerto
publicado puede ser diferente.

## Pruebas y calidad

```bash
# Suite completa
npm test

# Modo interactivo
npm run test:watch

# Análisis estático
npm run lint
```

Para ejecutar una prueba concreta:

```bash
npx vitest run src/ruta/componente.test.tsx
```

## Navegación principal

| Ruta | Contenido |
| --- | --- |
| `/dashboard` | Resumen de altas y modificaciones recientes |
| `/profile` | Perfil del usuario |
| `/backoffice/users` | Administración de usuarios |
| `/catalog/customers` | Clientes y fichas de detalle |
| `/catalog/assurance-companies` | Aseguradoras |
| `/catalog/contacts` | Contactos |
| `/catalog/insurance-policies` | Pólizas y fichas de detalle |
| `/catalog/insured-assets` | Bienes asegurados |
| `/catalog/attachments` | Documentos |

Las rutas de catálogo requieren permisos de consulta. Las acciones de alta,
edición o borrado dependen del rango del rol autenticado.

## Estructura

```text
src/
├── api/                     # Cliente HTTP, contratos y endpoints
├── auth/                    # Estado de autenticación y sesión
├── components/              # Componentes reutilizables
├── config/                  # Variables de entorno
├── hooks/                   # Hooks y protección de cambios
├── layouts/                 # Layout principal y procedimientos
├── pages/
│   ├── Catalog/             # Catálogos, detalles y formularios
│   ├── Backoffice/          # Administración
│   └── Profile/             # Perfil
├── routes/                  # Router, protección y roles
└── utils/                   # Fechas, direcciones, GPS y teléfonos
```

## Comunicación con la API

El cliente usa `VITE_API_URL` como URL base. La autenticación se envía mediante
Bearer JWT. Cuando el backend renueva el token, la aplicación procesa la
cabecera `X-Access-Token` expuesta por CORS.

Para desarrollo local, comprueba que el backend permita el origen de Vite:

```dotenv
WEB_UI_URL=http://localhost:5173
```

## Docker

La imagen de desarrollo instala dependencias y expone el puerto `5173`:

```bash
docker build -t insurances-frontend-server .
docker run --rm -p 5173:5173 --env-file .env insurances-frontend-server
```

`VITE_API_URL` debe ser accesible desde el navegador, no únicamente desde la
red interna de Docker.

## Licencia

Proyecto privado.
