import './Spinner.css'

/**
 * Spinner — Loading indicator.
 *
 * @param {object} props
 * @param {'sm'|'md'|'lg'} [props.size='md'] Visual size.
 * @param {string} [props.label='Cargando…'] Screen-reader label.
 */
function Spinner({ size = 'md', label = 'Cargando…' }) {
  return (
    <span className={`spinner spinner--${size}`} role="status">
      <span className="spinner__circle" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  )
}

export default Spinner
