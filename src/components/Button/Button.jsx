import Spinner from '@/components/Spinner/Spinner'
import './Button.css'

/**
 * Button — Action button with variants, sizes and a loading state.
 *
 * @param {object} props
 * @param {'primary'|'secondary'|'danger'|'ghost'} [props.variant='primary'] Visual variant.
 * @param {'sm'|'md'|'lg'} [props.size='md'] Visual size.
 * @param {boolean} [props.loading] Shows a spinner and disables the button.
 * @param {boolean} [props.disabled] Disables the button.
 * @param {Function} [props.onClick] Click handler.
 * @param {'button'|'submit'|'reset'} [props.type='button'] Native button type.
 * @param {React.ReactNode} props.children Label content.
 */
function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  children,
  ...rest
}) {
  return (
    <button
      type={type}
      className={`button button--${variant} button--${size}${loading ? ' button--loading' : ''}`}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && (
        <span className="button__spinner" aria-hidden="true">
          <Spinner size="sm" label="Cargando" />
        </span>
      )}
      <span className="button__label">{children}</span>
    </button>
  )
}

export default Button
