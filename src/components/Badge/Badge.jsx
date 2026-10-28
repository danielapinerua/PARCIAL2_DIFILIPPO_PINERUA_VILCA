import './Badge.css'

/**
 * Badge — Short label with a semantic color.
 *
 * @param {object} props
 * @param {'green'|'yellow'|'red'|'blue'|'gray'} [props.color='gray'] Semantic color.
 * @param {React.ReactNode} props.children Label content.
 */
function Badge({ color = 'gray', children }) {
  return <span className={`badge badge--${color}`}>{children}</span>
}

export default Badge
