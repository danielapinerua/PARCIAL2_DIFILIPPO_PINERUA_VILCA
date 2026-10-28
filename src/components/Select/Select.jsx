import { useId } from 'react'
import FormField from '@/components/FormField/FormField'
import './Select.css'

/**
 * Select — Native dropdown.
 *
 * @param {object} props
 * @param {React.ReactNode} props.label Field label.
 * @param {Array<{value: string, label: string}>} props.options Available options.
 * @param {string} props.value Controlled value.
 * @param {Function} props.onChange Native change handler.
 * @param {string} [props.error] Error message.
 * @param {string} [props.helpText] Help message.
 * @param {string} [props.placeholder] Disabled empty option.
 * @param {boolean} [props.disabled] Disables the select.
 * @param {boolean} [props.required] Marks the select as required.
 * @param {string} [props.id] Optional id override.
 */
function Select({
  label,
  options,
  value,
  onChange,
  error,
  helpText,
  placeholder,
  disabled = false,
  required = false,
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
      <select
        id={fieldId}
        className={error ? 'select select--error' : 'select'}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  )
}

export default Select
