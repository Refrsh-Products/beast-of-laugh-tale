import { useState } from 'react'

export default function MenuRow({
  label,
  color,
  weight,
  action,
  isDelete = false,
}: {
  label: string
  color: string
  weight: number
  action: () => void
  isDelete?: boolean
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={action}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '10px 16px',
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: '0.72rem',
        color,
        fontWeight: weight,
        cursor: 'pointer',
        background: hovered && !isDelete ? '#f0f0f0' : 'transparent',
        userSelect: 'none',
      }}
    >
      {label}
    </div>
  )
}
