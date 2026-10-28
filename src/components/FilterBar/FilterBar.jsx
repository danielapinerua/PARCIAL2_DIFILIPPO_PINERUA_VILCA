import Button from '@/components/Button/Button'
import './FilterBar.css'

/**
 * FilterBar — Wrapper for filter controls with a clear action.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children Filter controls.
 * @param {Function} [props.onClear] Resets the filters; hides the button when omitted.
 */
function FilterBar({ children, onClear }) {
  return (
    <section className="filter-bar" aria-label="Filtros">
      <div className="filter-bar__controls">{children}</div>
      {onClear && (
        <div className="filter-bar__actions">
          <Button variant="ghost" size="sm" onClick={onClear}>
            Limpiar filtros
          </Button>
        </div>
      )}
    </section>
  )
}

export default FilterBar
