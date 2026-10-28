import { useEffect, useRef, useState } from 'react'
import Navbar from '@/components/Navbar/Navbar'
import Sidebar from '@/components/Sidebar/Sidebar'
import './AppLayout.css'

/**
 * AppLayout — Presentational application shell: navbar, sidebar and content.
 *
 * Owns the mobile sidebar UI state only. No router or authentication logic.
 *
 * @param {object} props
 * @param {Array<{href: string, label: string, icon?: React.ReactNode, isActive?: boolean}>} props.sidebarItems Navigation items.
 * @param {string} props.userName Signed-in user name.
 * @param {string} props.roleLabel Role label shown in the navbar.
 * @param {'green'|'yellow'|'red'|'blue'|'gray'} [props.roleColor='gray'] Role badge color.
 * @param {Function} props.onLogout Logout handler.
 * @param {React.ReactNode} props.children Page content.
 */
function AppLayout({
  sidebarItems,
  userName,
  roleLabel,
  roleColor,
  onLogout,
  children,
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const menuButtonRef = useRef(null)

  useEffect(() => {
    const query = window.matchMedia('(min-width: 768px)')
    const handleChange = (event) => {
      if (event.matches) setIsSidebarOpen(false)
    }

    query.addEventListener('change', handleChange)
    return () => query.removeEventListener('change', handleChange)
  }, [])

  const closeSidebar = () => {
    setIsSidebarOpen(false)
    if (menuButtonRef.current?.offsetParent) {
      menuButtonRef.current.focus()
    }
  }

  return (
    <div className="app-layout">
      <a className="app-layout__skip-link" href="#main-content">
        Saltar al contenido
      </a>
      <Navbar
        userName={userName}
        roleLabel={roleLabel}
        roleColor={roleColor}
        onLogout={onLogout}
        onMenuClick={() => setIsSidebarOpen(true)}
        isSidebarOpen={isSidebarOpen}
        menuButtonRef={menuButtonRef}
      />
      <div className="app-layout__body">
        <Sidebar items={sidebarItems} isOpen={isSidebarOpen} onClose={closeSidebar} />
        <main
          className="app-layout__main"
          id="main-content"
          tabIndex={-1}
          inert={isSidebarOpen}
        >
          <div className="app-layout__content">{children}</div>
        </main>
      </div>
    </div>
  )
}

export default AppLayout
