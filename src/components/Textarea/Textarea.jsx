import { useId } from 'react'
import FormField from '@/components/FormField/FormField'
import './Textarea.css'

/**
 * Textarea — Multi-line text field.
 *
 * @param {object} props
 * @param {React.ReactNode} props.label Field label.
 * @param {string} props.value Controlled value.
 * @param {Function} props.onChange Native change handler.
 * @param {number} [props.rows=4] Visible rows.
 * @param {string} [props.error] Error message.
 * @param {string} [props.helpText] Help message.
 * @param {number} [props.maxLength] Maximum character count.
 * @param {boolean} [props.required] Marks the field as required.
 * @param {boolean} [props.disabled] Disables the field.
 * @param {string} [props.id] Optional id override.
 */
function Textarea({
  label,
  value,
  onChange,
  rows = 4,
  error,
  helpText,
  maxLength,
  required = false,
  disabled = false,
  id,
  ...rest
}) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const describedBy =
    [error ? `${fieldId}-error` : null, helpText && !error ? `${fieldId}-help` : null]
      .filter(Boolean)
      .join(' ') || undefined

  return (
    <FormField
      label={label}
      id={fieldId}
      error={error}
      helpText={helpText}
      required={required}
    >
      <textarea
        id={fieldId}
        className={error ? 'textarea textarea--error' : 'textarea'}
        value={value}
        onChange={onChange}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      />
      {typeof maxLength === 'number' && (
        <span className="textarea__counter" aria-hidden="true">
          {value ? value.length : 0}/{maxLength}
        </span>
      )}
    </FormField>
  )
}

export default Textarea
