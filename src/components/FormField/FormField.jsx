import './FormField.css'

/**
 * FormField — Label + control wrapper with help text and error message.
 *
 * The `id` is shared with the control: help text uses `${id}-help` and the
 * error uses `${id}-error`, so the control can build `aria-describedby`.
 *
 * @param {object} props
 * @param {React.ReactNode} props.label Field label.
 * @param {string} props.id Control id.
 * @param {string} [props.error] Error message.
 * @param {string} [props.helpText] Help message.
 * @param {boolean} [props.required] Shows a required marker.
 * @param {React.ReactNode} props.children Control element.
 */
function FormField({ label, id, error, helpText, required, children }) {
  return (
    <div className="form-field">
      <label className="form-field__label" htmlFor={id}>
        {label}
        {required && (
          <span className="form-field__required" aria-hidden="true">
            *
          </span>
        )}
        {required && <span className="sr-only"> (obligatorio)</span>}
      </label>
      {children}
      {helpText && !error && (
        <p className="form-field__help" id={`${id}-help`}>
          {helpText}
        </p>
      )}
      {error && (
        <p className="form-field__error" id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export default FormField
