import { createPortal } from 'react-dom'
import type { Notebook } from '../../storage'

const B = '#000000'
const W = '#FFFFFF'

export default function DeleteNotebookModal({
  notebook,
  onConfirm,
  onClose,
}: {
  notebook: Notebook
  onConfirm: () => void
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
          maxWidth: 400,
          width: '90%',
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: '1.2rem',
            margin: '0 0 8px',
          }}
        >
          Delete notebook?
        </h2>
        <p
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.72rem',
            color: '#555',
            margin: '0 0 24px',
            lineHeight: 1.6,
          }}
        >
          "{notebook.title}" will be permanently deleted. This cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.72rem',
              fontWeight: 600,
              letterSpacing: '0.06em',
              padding: '10px 20px',
              background: W,
              border: `2px solid ${B}`,
              boxShadow: `3px 3px 0 ${B}`,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.72rem',
              fontWeight: 600,
              letterSpacing: '0.06em',
              padding: '10px 20px',
              background: '#cc0000',
              color: W,
              border: `2px solid #cc0000`,
              boxShadow: `3px 3px 0 ${B}`,
              cursor: 'pointer',
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
