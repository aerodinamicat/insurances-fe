# AppLayout

Shell React reutilizable para aplicaciones con barra lateral y contenido.

## Archivos transferibles

- `AppLayout.tsx`
- `AppLayout.css`
- `index.ts`

Sólo depende de React. No conoce React Router, autenticación, permisos ni la
navegación del proyecto.

```tsx
import { AppLayout } from './components/AppLayout'

<AppLayout aside={<MyAside />} mainAriaLabel="Contenido principal">
  <MyRouterOutlet />
</AppLayout>
```

El consumidor es responsable de construir el `aside` y proporcionar el
contenido. Las clases `app-layout` y `app-layout__main` pueden ampliarse mediante
`className` y `mainClassName`.
