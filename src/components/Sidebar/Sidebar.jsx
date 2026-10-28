import { useEffect, useRef } from 'react'
import Button from '@/components/Button/Button'
import NavItem from '@/components/NavItem/NavItem'
import './Sidebar.css'

/**
 * Sidebar — Main navigation. Off-canvas drawer below 768px.
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
      <aside
        id="app-sidebar"
        className={isOpen ? 'sidebar sidebar--open' : 'sidebar'}
      >
        <div className="sidebar__header">
          <span className="sidebar__heading">Navegación</span>
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
          <ul className="sidebar__list">
            {items.map((item, index) => (
              <li key={`${item.href}-${index}`}>
                <NavItem
                  href={item.href}
                  icon={item.icon}
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
