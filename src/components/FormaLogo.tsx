interface FormaLogoProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'full' | 'icon'
}

export default function FormaLogo({ size = 'md', variant = 'full' }: FormaLogoProps) {
  const sizes = {
    sm: { icon: 28, text: 16, gap: 8 },
    md: { icon: 36, text: 20, gap: 10 },
    lg: { icon: 48, text: 28, gap: 14 },
  }
  const s = sizes[size]

  return (
    <div className="flex items-center" style={{ gap: s.gap }}>
      {/* Icon mark — stylized F with a diagonal slash suggesting movement */}
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background square with rounded corners */}
        <rect width="40" height="40" rx="10" fill="#a3e635" />

        {/* Bold F letterform */}
        <path
          d="M11 10H29V14.5H15.5V18.5H27V23H15.5V30H11V10Z"
          fill="#0a0a0a"
        />

        {/* Diagonal accent slash — suggests speed/movement */}
        <path
          d="M24 22L31 30"
          stroke="#0a0a0a"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.3"
        />
      </svg>

      {/* Wordmark */}
      {variant === 'full' && (
        <span
          style={{ fontSize: s.text, letterSpacing: '-0.02em' }}
          className="font-black text-white tracking-tight"
        >
          forma
        </span>
      )}
    </div>
  )
}
