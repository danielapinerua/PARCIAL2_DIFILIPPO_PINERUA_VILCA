import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import Button from '@/components/Button/Button'
import './Modal.css'

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Modal — Accessible dialog rendered in a portal.
 *
 * Closes with Escape or a backdrop click, locks body scroll, traps focus and
 * restores it to the previously focused element on close.
 *
 * @param {object} props
 * @param {boolean} props.isOpen Whether the dialog is open.
 * @param {React.ReactNode} props.title Dialog title.
 * @param {Function} props.onClose Close handler.
 * @param {React.ReactNode} props.children Dialog body.
 * @param {React.ReactNode} [props.footer] Optional footer actions.
 */
function Modal({ isOpen, title, onClose, children, footer }) {
  const titleId = useId()
  const panelRef = useRef(null)
  const previouslyFocused = useRef(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!isOpen) return undefined

    previouslyFocused.current = document.activeElement
    const { body } = document
    const previousOverflow = body.style.overflow
    body.style.overflow = 'hidden'

    const panel = panelRef.current
    if (panel) {
      const initialFocus =
        panel.querySelector('[data-autofocus]') || panel.querySelector(FOCUSABLE_SELECTOR) || panel
      initialFocus.focus()
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onCloseRef.current()
        return
      }

      if (event.key !== 'Tab' || !panel) return

      const focusable = Array.from(panel.querySelectorAll(FOCUSABLE_SELECTOR))
      if (focusable.length === 0) {
        event.preventDefault()
        panel.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      body.style.overflow = previousOverflow
      if (previouslyFocused.current instanceof HTMLElement) {
        previouslyFocused.current.focus()
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleBackdropMouseDown = (event) => {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  return createPortal(
    <div className="modal-overlay" onMouseDown={handleBackdropMouseDown}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={panelRef}
        tabIndex={-1}
      >
        <header className="modal__header">
          <h2 className="modal__title" id={titleId}>
            {title}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Cerrar">
            ✕
          </Button>
        </header>
        <div className="modal__body">{children}</div>
        {footer && <footer className="modal__footer">{footer}</footer>}
      </div>
    </div>,
    document.body,
  )
}

export default Modal
