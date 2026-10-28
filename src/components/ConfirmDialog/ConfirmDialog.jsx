import Modal from '@/components/Modal/Modal'
import Button from '@/components/Button/Button'
import './ConfirmDialog.css'

/**
 * ConfirmDialog — Confirmation dialog for destructive or irreversible actions.
 *
 * Escape and the backdrop trigger `onCancel`.
 *
 * @param {object} props
 * @param {boolean} props.isOpen Whether the dialog is open.
 * @param {React.ReactNode} props.title Dialog title.
 * @param {React.ReactNode} props.message Confirmation message.
 * @param {string} [props.confirmLabel='Confirmar'] Confirm button label.
 * @param {Function} props.onConfirm Confirm handler.
 * @param {Function} props.onCancel Cancel handler.
 * @param {boolean} [props.danger] Uses the danger button variant.
 */
function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmar',
  onConfirm,
  onCancel,
  danger = false,
}) {
  return (
    <Modal
      isOpen={isOpen}
      title={title}
      onClose={onCancel}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} data-autofocus>
            Cancelar
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="confirm-dialog__message">{message}</p>
    </Modal>
  )
}

export default ConfirmDialog
