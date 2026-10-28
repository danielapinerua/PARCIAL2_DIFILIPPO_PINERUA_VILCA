import Card from '@/components/Card/Card'
import './StatCard.css'

const TREND_LABELS = {
  up: 'Tendencia al alza',
  down: 'Tendencia a la baja',
  flat: 'Sin cambios',
}

const TREND_ICONS = {
  up: '↑',
  down: '↓',
  flat: '→',
}

/**
 * StatCard — Indicator card with an optional icon and trend.
 *
 * @param {object} props
 * @param {React.ReactNode} props.label Metric label.
 * @param {React.ReactNode} props.value Metric value.
 * @param {React.ReactNode} [props.icon] Decorative icon.
 * @param {string} [props.trend] Trend text, e.g. "+12% vs. mes anterior".
 * @param {'up'|'down'|'flat'} [props.trendDirection='flat'] Trend direction.
 */
function StatCard({ label, value, icon, trend, trendDirection = 'flat' }) {
  return (
    <Card>
      <div className="stat-card">
        {icon && (
          <span className="stat-card__icon" aria-hidden="true">
            {icon}
          </span>
        )}
        <div className="stat-card__content">
          <p className="stat-card__label">{label}</p>
          <p className="stat-card__value">{value}</p>
          {trend && (
            <p className={`stat-card__trend stat-card__trend--${trendDirection}`}>
              <span aria-hidden="true">{TREND_ICONS[trendDirection]} </span>
              {trend}
              <span className="sr-only"> ({TREND_LABELS[trendDirection]})</span>
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}

export default StatCard
