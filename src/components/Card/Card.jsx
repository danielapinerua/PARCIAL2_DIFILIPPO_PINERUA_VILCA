import { useId } from 'react'
import './Card.css'

/**
 * Card — Surface container with optional title and footer.
 *
 * When `onClick` is provided the card becomes a button-like control. Avoid
 * placing other interactive elements inside a clickable card.
 *
 * @param {object} props
 * @param {React.ReactNode} [props.title] Optional heading.
 * @param {React.ReactNode} [props.footer] Optional footer content.
 * @param {React.ReactNode} props.children Body content.
 * @param {Function} [props.onClick] Makes the card clickable.
 */
function Card({ title, footer, children, onClick }) {
  const titleId = useId()
  const isClickable = typeof onClick === 'function'

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onClick(event)
    }
  }

  return (
    <section
      className={isClickable ? 'card card--clickable' : 'card'}
      aria-labelledby={title ? titleId : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? onClick : undefined}
      onKeyDown={isClickable ? handleKeyDown : undefined}
    >
      {title && (
        <header className="card__header">
          <h2 className="card__title" id={titleId}>
            {title}
          </h2>
        </header>
      )}
      <div className="card__body">{children}</div>
      {footer && <footer className="card__footer">{footer}</footer>}
    </section>
  )
}

export default Card
