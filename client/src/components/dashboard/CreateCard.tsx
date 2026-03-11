import { useState } from 'react'

const G = '#84e487'
const B = '#000000'
const W = '#FFFFFF'

export default function CreateCard({ onCreate }: { onCreate: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={onCreate}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        height: 140,
        border: hovered ? `2px dashed ${G}` : `2px dashed ${B}`,
        background: W,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        cursor: 'pointer',
        transition: 'border-color 0.1s',
      }}
    >
      <span style={{ fontSize: '1.8rem', color: '#aaa', lineHeight: 1 }}>+</span>
      <span
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.72rem',
          color: '#888',
        }}
      >
        New notebook
      </span>
    </div>
  )
}
