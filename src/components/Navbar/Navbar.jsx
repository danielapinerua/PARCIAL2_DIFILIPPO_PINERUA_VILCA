import Badge from '@/components/Badge/Badge'
import BrandMark from '@/components/BrandMark/BrandMark'
import Button from '@/components/Button/Button'
import './Navbar.css'

const getInitials = (name = '') =>
  name
    .replace(/^Dr\.\s*/, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')

/**
 * Navbar — Top bar above the content.
 *
 * @param {object} props
 * @param {string} props.userName Signed-in user name.
 * @param {string} props.roleLabel Role label shown as a badge.
 * @param {'green'|'yellow'|'red'|'blue'|'gray'} [props.roleColor='gray'] Role badge color.
 * @param {Function} props.onLogout Logout handler.
 * @param {Function} props.onMenuClick Opens the mobile sidebar.
 * @param {boolean} [props.isSidebarOpen] Mobile sidebar state for aria-expanded.
 * @param {React.Ref} [props.menuButtonRef] Ref to the hamburger button.
 */
function Navbar({
  userName,
  roleLabel,
  roleColor = 'gray',
  onLogout,
  onMenuClick,
  isSidebarOpen = false,
  menuButtonRef,
}) {
  return (
    <header className="navbar">
      <div className="navbar__left">
        <span className="navbar__menu">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            aria-label="Abrir menú"
            aria-expanded={isSidebarOpen}
            aria-controls="app-sidebar"
            ref={menuButtonRef}
          >
            <span className="navbar__hamburger" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </Button>
        </span>
        <span className="navbar__brand">
          <BrandMark />
        </span>
      </div>
      <div className="navbar__right">
        <div className="navbar__user">
          <span className="navbar__avatar" aria-hidden="true">
            {getInitials(userName)}
          </span>
          <span className="navbar__user-info">
            <span className="navbar__user-name">{userName}</span>
            {roleLabel && <Badge color={roleColor}>{roleLabel}</Badge>}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={onLogout}>
          Salir
        </Button>
      </div>
    </header>
  )
}

export default Navbar