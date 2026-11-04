import { Link } from 'react-router-dom'
import './NavItem.css'

/**
 * NavItem — Sidebar navigation link.
 *
 * @param {object} props
 * @param {string} props.href Link target.
 * @param {React.ReactNode} [props.icon] Decorative icon.
 * @param {React.ReactNode} props.label Visible label.
 * @param {boolean} [props.isActive] Marks the current page.
 */
function NavItem({ href, icon, label, isActive = false }) {
  return (
    <Link
      className={isActive ? 'nav-item nav-item--active' : 'nav-item'}
      to={href}
      aria-current={isActive ? 'page' : undefined}
    >
      {icon && (
        <span className="nav-item__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="nav-item__label">{label}</span>
    </Link>
  )
}

export default NavItem
