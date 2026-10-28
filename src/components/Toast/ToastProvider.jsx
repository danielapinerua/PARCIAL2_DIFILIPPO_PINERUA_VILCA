import { useRef, useState } from 'react'
import ToastContext from './ToastContext'
import Toast from './Toast'

const MAX_TOASTS = 4

/**
 * ToastProvider — Holds the toast queue and renders the live region.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children Application tree.
 */
function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const counter = useRef(0)

  const show = (type, message) => {
    counter.current += 1
    const id = counter.current
    setToasts((current) => [...current, { id, type, message }].slice(-MAX_TOASTS))
  }

  const dismiss = (id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }

  const api = {
    success: (message) => show('success', message),
    error: (message) => show('error', message),
    info: (message) => show('info', message),
  }

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-viewport" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            type={toast.type}
            message={toast.message}
            onClose={() => dismiss(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export default ToastProvider
