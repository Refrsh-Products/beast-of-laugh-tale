import { createPortal } from 'react-dom'
import Button from '../ui/LegacyButton'

const B = '#000000'
const W = '#FFFFFF'

export default function CreateNotebookModal({
  title,
  error,
  onTitleChange,
  onSubmit,
  onClose,
}: {
  title: string
  error: string
  onTitleChange: (val: string) => void
  onSubmit: () => void
  onClose: () => void
}) {
  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
      }}
      onMouseDown={onClose}
    >
      <div
        style={{
          background: W,
          border: `2px solid ${B}`,
          boxShadow: `8px 8px 0 ${B}`,
          padding: '32px',
          maxWidth: 420,
          width: '90%',
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: '1.2rem',
            margin: '0 0 20px',
          }}
        >
          New notebook
        </h2>
        <form
          onSubmit={(e) => { e.preventDefault(); onSubmit() }}
          style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          <div>
            <label
              style={{
                display: 'block',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                marginBottom: 6,
              }}
            >
              TITLE
            </label>
            <input
              autoFocus
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="e.g. Physics — Semester 2"
              style={{
                width: '100%',
                border: error ? '3px solid #cc0000' : `3px solid ${B}`,
                borderRadius: 0,
                padding: '10px 12px',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.82rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {error && (
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.72rem', color: '#cc0000', margin: '6px 0 0' }}>
                {error}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button variant="default" type="button" onClick={onClose}>Cancel</Button>
            <Button variant="green" type="submit">Create →</Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
