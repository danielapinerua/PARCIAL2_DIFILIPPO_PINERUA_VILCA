import { useEffect, useRef } from 'react'
import './Toast.css'

const TOAST_ICONS = {
  success: '✓',
  error: '✕',
  info: 'i',
}

/**
 * Toast — Single floating notification.
 *
 * @param {object} props
 * @param {'success'|'error'|'info'} props.type Notification type.
 * @param {string} props.message Notification message.
 * @param {Function} props.onClose Dismiss handler.
 * @param {number} [props.duration=4000] Auto-dismiss delay in milliseconds.
 */
function Toast({ type, message, onClose, duration = 4000 }) {
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!duration) return undefined
    const timer = setTimeout(() => onCloseRef.current(), duration)
    return () => clearTimeout(timer)
  }, [duration])

  return (
    <div className={`toast toast--${type}`} role={type === 'error' ? 'alert' : undefined}>
      <span className="toast__icon" aria-hidden="true">
        {TOAST_ICONS[type]}
      </span>
      <p className="toast__message">{message}</p>
      <button
        type="button"
        className="toast__close"
        onClick={onClose}
        aria-label="Cerrar notificación"
      >
        ✕
      </button>
    </div>
  )
}

export default Toast
