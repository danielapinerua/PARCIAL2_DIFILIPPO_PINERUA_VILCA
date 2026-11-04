import { useEffect, useRef } from 'react'
import BrandMark from '@/components/BrandMark/BrandMark'
import Button from '@/components/Button/Button'
import NavItem from '@/components/NavItem/NavItem'
import './Sidebar.css'

const ICON_PATHS = {
  home: (
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M10 21v-6h4v6" />
    </>
  ),
  paw: (
    <>
      <circle cx="7" cy="6.5" r="2" />
      <circle cx="17" cy="6.5" r="2" />
      <circle cx="4" cy="13" r="2" />
      <circle cx="20" cy="13" r="2" />
      <path d="M8.5 19c0-2 1.6-3.5 3.5-3.5s3.5 1.5 3.5 3.5-1.6 2.5-3.5 2.5-3.5-.5-3.5-2.5Z" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </>
  ),
  heart: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />,
  file: (
    <>
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z" />
      <path d="M14 3v6h6M8 13h8M8 17h5" />
    </>
  ),
  card: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.5 2.9-5.5 6.5-5.5s6.5 2 6.5 5.5" />
      <path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c2.1.6 3.5 2.4 3.5 5.2" />
    </>
  ),
  chart: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
}

// Ícono automático según la ruta, si el ítem no trae uno propio
const ICON_BY_ROUTE = {
  '/home': 'home',
  '/dashboard': 'chart',
  '/pets': 'paw',
  '/appointments': 'calendar',
  '/schedule': 'calendar',
  '/treatments': 'heart',
  '/history': 'file',
  '/payments': 'card',
  '/clients': 'users',
  '/users': 'users',
  '/profile': 'user',
}

function RouteIcon({ name }) {
  if (!ICON_PATHS[name]) return null
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {ICON_PATHS[name]}
    </svg>
  )
}

/**
 * Sidebar — Full-height main navigation. Off-canvas drawer below 768px.
 *
 * @param {object} props
 * @param {Array<{href: string, label: string, icon?: React.ReactNode, isActive?: boolean}>} props.items Navigation items.
 * @param {boolean} [props.isOpen] Mobile drawer state.
 * @param {Function} [props.onClose] Close handler for the mobile drawer.
 */
function Sidebar({ items, isOpen = false, onClose }) {
  const closeButtonRef = useRef(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!isOpen) return undefined

    const { body } = document
    const previousOverflow = body.style.overflow
    body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onCloseRef.current?.()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      body.style.overflow = previousOverflow
    }
  }, [isOpen])

  return (
    <>
      {isOpen && <div className="sidebar__overlay" aria-hidden="true" onClick={onClose} />}
      <aside id="app-sidebar" className={isOpen ? 'sidebar sidebar--open' : 'sidebar'}>
        <div className="sidebar__header">
          <BrandMark inverse />
          <span className="sidebar__close">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="Cerrar menú"
              ref={closeButtonRef}
            >
              ✕
            </Button>
          </span>
        </div>
        <nav className="sidebar__nav" aria-label="Navegación principal">
          <p className="sidebar__heading">Menú</p>
          <ul className="sidebar__list">
            {items.map((item, index) => (
              <li key={`${item.href}-${index}`}>
                <NavItem
                  href={item.href}
                  icon={item.icon ?? <RouteIcon name={ICON_BY_ROUTE[item.href]} />}
                  label={item.label}
                  isActive={item.isActive}
                />
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  )
}

export default Sidebar