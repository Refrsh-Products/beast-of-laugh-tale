import { useState } from 'react'

const B = '#000000'

export default function ProfileMenuItem({
  label,
  color = B,
  onClick,
}: {
  label: string
  color?: string
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '10px 16px',
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: '0.72rem',
        color,
        fontWeight: color === '#cc0000' ? 600 : 400,
        cursor: 'pointer',
        background: hovered && color !== '#cc0000' ? '#f0f0f0' : 'transparent',
        userSelect: 'none',
      }}
    >
      {label}
    </div>
  )
}
