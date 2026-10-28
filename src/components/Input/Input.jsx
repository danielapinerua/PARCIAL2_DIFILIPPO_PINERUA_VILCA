import { useId } from 'react'
import FormField from '@/components/FormField/FormField'
import './Input.css'

/**
 * Input — Single-line text field.
 *
 * @param {object} props
 * @param {React.ReactNode} props.label Field label.
 * @param {'text'|'email'|'password'|'number'|'date'|'time'} [props.type='text'] Input type.
 * @param {string} props.value Controlled value.
 * @param {Function} props.onChange Native change handler.
 * @param {string} [props.error] Error message.
 * @param {string} [props.helpText] Help message.
 * @param {string} [props.placeholder] Placeholder text.
 * @param {boolean} [props.disabled] Disables the input.
 * @param {boolean} [props.required] Marks the input as required.
 * @param {string} [props.id] Optional id override.
 */
function Input({
  label,
  type = 'text',
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
      <input
        id={fieldId}
        className={error ? 'input input--error' : 'input'}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      />
    </FormField>
  )
}

export default Input
