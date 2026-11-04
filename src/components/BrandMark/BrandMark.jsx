import './BrandMark.css'

/**
 * BrandMark — PataSana logo (paw mark + name).
 *
 * @param {object} props
 * @param {boolean} [props.inverse] Light text for dark backgrounds.
 */
function BrandMark({ inverse = false }) {
  return (
    <span className={inverse ? 'brand-mark brand-mark--inverse' : 'brand-mark'}>
      <span className="brand-mark__icon" aria-hidden="true">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          focusable="false"
        >
          <circle cx="7" cy="6.5" r="2" />
          <circle cx="17" cy="6.5" r="2" />
          <circle cx="4" cy="13" r="2" />
          <circle cx="20" cy="13" r="2" />
          <path d="M8.5 19c0-2 1.6-3.5 3.5-3.5s3.5 1.5 3.5 3.5-1.6 2.5-3.5 2.5-3.5-.5-3.5-2.5Z" />
        </svg>
      </span>
      <span className="brand-mark__name">PataSana</span>
    </span>
  )
}

export default BrandMark