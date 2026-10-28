import './PageHeader.css'

/**
 * PageHeader — Page title, subtitle and actions slot.
 *
 * @param {React.ReactNode} props.title Page title.
 * @param {React.ReactNode} [props.subtitle] Supporting text.
 * @param {React.ReactNode} [props.actions] Action buttons or controls.
 */
function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="page-header">
      <div className="page-header__titles">
        <h1 className="page-header__title">{title}</h1>
        {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </div>
  )
}

export default PageHeader
