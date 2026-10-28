import './ProgressBar.css'

/**
 * ProgressBar — Horizontal progress indicator.
 *
 * @param {object} props
 * @param {number} props.value Current value.
 * @param {number} [props.max=100] Maximum value.
 * @param {string} [props.label] Visible label and accessible name.
 */
function ProgressBar({ value, max = 100, label }) {
  const safeMax = max > 0 ? max : 100
  const clamped = Math.min(Math.max(value, 0), safeMax)
  const percent = Math.round((clamped / safeMax) * 100)

  return (
    <div className="progress-bar">
      <div className="progress-bar__header">
        {label && <span className="progress-bar__label">{label}</span>}
        <span className="progress-bar__value">{percent}%</span>
      </div>
      <div
        className="progress-bar__track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={clamped}
        aria-label={label || 'Progreso'}
      >
        <div className="progress-bar__fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

export default ProgressBar
