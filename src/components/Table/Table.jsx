import EmptyState from '@/components/EmptyState/EmptyState'
import Spinner from '@/components/Spinner/Spinner'
import './Table.css'

/**
 * Table — Configurable data table.
 *
 * @param {object} props
 * @param {Array<{key: string, header: React.ReactNode, render?: Function}>} props.columns Columns definition.
 * @param {Array<object>} props.data Row data. Each row should have an `id`.
 * @param {React.ReactNode} [props.emptyMessage='No hay datos para mostrar.'] Empty state message.
 * @param {Function} [props.onRowClick] Makes rows clickable.
 * @param {boolean} [props.loading] Shows a loading state.
 */
function Table({
  columns,
  data,
  emptyMessage = 'No hay datos para mostrar.',
  onRowClick,
  loading = false,
}) {
  const isClickable = typeof onRowClick === 'function'
  const columnCount = columns.length || 1

  const handleRowKeyDown = (event, row) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onRowClick(row)
    }
  }

  return (
    <div className="table-wrapper" role="region" aria-label="Tabla de datos" tabIndex={0}>
      <table className="table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td className="table__state" colSpan={columnCount}>
                <Spinner size="md" label="Cargando datos…" />
              </td>
            </tr>
          )}

          {!loading && data.length === 0 && (
            <tr>
              <td className="table__state" colSpan={columnCount}>
                <EmptyState title="Sin resultados" message={emptyMessage} />
              </td>
            </tr>
          )}

          {!loading &&
            data.map((row, index) => (
              <tr
                key={row.id ?? index}
                className={isClickable ? 'table__row table__row--clickable' : 'table__row'}
                onClick={isClickable ? () => onRowClick(row) : undefined}
                onKeyDown={
                  isClickable ? (event) => handleRowKeyDown(event, row) : undefined
                }
                tabIndex={isClickable ? 0 : undefined}
              >
                {columns.map((column) => (
                  <td key={column.key} className="table__cell">
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  )
}

export default Table
