# TableLayout

Tabla React reutilizable con filtrado global, orden por columnas y paginación.

## Archivos transferibles

- `TableLayout.tsx`
- `TableLayout.css`
- `index.ts`

Sólo depende de React. Las celdas y acciones se reciben como `ReactNode`, por lo
que el componente no conoce catálogos, permisos, rutas ni APIs.

```tsx
const columns: TableLayoutColumn<Item>[] = [
  {
    key: 'name',
    header: 'Nombre',
    render: (item) => item.name,
    getSortValue: (item) => item.name,
  },
]

<TableLayout
  columns={columns}
  items={items}
  getItemKey={(item) => item.id}
/>
```

## Tokens CSS

El proyecto receptor debe definir los tokens `--text`, `--text-h`, `--bg`,
`--code-bg`, `--border`, `--search-highlight-bg` y
`--search-highlight-text`, o sustituirlos en `TableLayout.css`.

La clase `table-layout__actions` está disponible para columnas compactas. Los
estilos concretos de los botones pertenecen al componente de acciones del
proyecto consumidor y no forman parte de `TableLayout`.
