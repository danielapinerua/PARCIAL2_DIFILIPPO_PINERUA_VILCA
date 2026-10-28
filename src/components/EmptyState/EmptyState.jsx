import './EmptyState.css'

/**
 * EmptyState — Placeholder for empty lists or missing data.
 *
 * @param {object} props
 * @param {React.ReactNode} props.title Main message.
 * @param {React.ReactNode} [props.message] Supporting text.
 * @param {React.ReactNode} [props.icon] Decorative icon.
 * @param {React.ReactNode} [props.action] Optional call to action.
 */
function EmptyState({ title, message, icon, action }) {
  return (
    <div className="empty-state">
      {icon && (
        <div className="empty-state__icon" aria-hidden="true">
          {icon}
        </div>
      )}
      <h3 className="empty-state__title">{title}</h3>
      {message && <p className="empty-state__message">{message}</p>}
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  )
}

export default EmptyState
