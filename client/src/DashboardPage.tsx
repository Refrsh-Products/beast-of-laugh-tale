import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, Navigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import {
  getUser,
  isLoggedIn,
  endSession,
  getNotebooks,
  seedNotebooks,
  updateNotebook,
  type Notebook,
} from './storage'

const G = '#84e487'
const B = '#000000'
const W = '#FFFFFF'

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Three-dot dropdown ─────────────────────────────────────────────
function NotebookMenu({
  notebook,
  top,
  right,
  onPin,
  onRename,
  onArchive,
  onDelete,
}: {
  notebook: Notebook
  top: number
  right: number
  onPin: () => void
  onRename: () => void
  onArchive: () => void
  onDelete: () => void
}) {
  return (
    <div
      style={{
        position: 'fixed',
        top,
        right,
        zIndex: 1000,
        background: W,
        border: `2px solid ${B}`,
        boxShadow: `4px 4px 0 ${B}`,
        minWidth: 140,
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {[
        { label: notebook.pinned ? 'Unpin' : 'Pin', action: onPin, color: B, weight: 400 },
        { label: 'Rename', action: onRename, color: B, weight: 400 },
      ].map((item) => (
        <MenuRow key={item.label} label={item.label} color={item.color} weight={item.weight} action={item.action} />
      ))}
      <div style={{ height: 1, background: '#eee', margin: '2px 0' }} />
      {[
        { label: 'Archive', action: onArchive, color: B, weight: 400 },
        { label: 'Delete', action: onDelete, color: '#cc0000', weight: 600 },
      ].map((item) => (
        <MenuRow key={item.label} label={item.label} color={item.color} weight={item.weight} action={item.action} isDelete={item.label === 'Delete'} />
      ))}
    </div>
  )
}

function MenuRow({
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

// ── Notebook Card (grid) ───────────────────────────────────────────
function NotebookCard({
  notebook,
  openMenuId,
  onMenuOpen,
}: {
  notebook: Notebook
  openMenuId: number | null
  onMenuOpen: (id: number | null, anchor?: { top: number; right: number }) => void
}) {
  const [hovered, setHovered] = useState(false)
  const menuOpen = openMenuId === notebook.id

  return (
    <div
      style={{
        height: 140,
        position: 'relative',
        padding: 16,
        background: W,
        border: hovered || menuOpen ? `2px solid ${G}` : `2px solid ${B}`,
        boxShadow: hovered || menuOpen ? `6px 6px 0 ${B}` : `3px 3px 0 ${B}`,
        transform: hovered || menuOpen ? 'translate(-2px, -2px)' : 'none',
        transition: 'transform 0.1s, box-shadow 0.1s, border-color 0.1s',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ width: 16 }}>
          {notebook.pinned && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill={G}>
              <path d="M9 1H3a1 1 0 0 0-1 1v1.5l2 2V10l2 1 2-1V5.5l2-2V2a1 1 0 0 0-1-1Z" />
            </svg>
          )}
        </div>
        {/* Three-dot button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (menuOpen) { onMenuOpen(null); return }
            const rect = e.currentTarget.getBoundingClientRect()
            onMenuOpen(notebook.id, { top: rect.bottom + 4, right: window.innerWidth - rect.right })
          }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0 2px',
            fontSize: '1rem',
            lineHeight: 1,
            color: '#888',
            opacity: hovered || menuOpen ? 1 : 0,
            transition: 'opacity 0.1s',
          }}
        >
          ⋮
        </button>
      </div>

      {/* Title */}
      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 700,
          fontSize: '0.95rem',
          lineHeight: 1.3,
          flex: 1,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          marginTop: 4,
        }}
      >
        {notebook.title}
      </div>

      {/* Bottom row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.62rem',
          color: '#888',
          marginTop: 8,
        }}
      >
        <span>Created {formatDate(notebook.created_at)}</span>
        <span>{notebook.file_count} files</span>
      </div>
    </div>
  )
}

// ── Create Card (grid) ─────────────────────────────────────────────
function CreateCard() {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={() => console.log('Create new notebook clicked')}
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

// ── Notebook Row (list) ────────────────────────────────────────────
function NotebookRow({
  notebook,
  openMenuId,
  onMenuOpen,
}: {
  notebook: Notebook
  openMenuId: number | null
  onMenuOpen: (id: number | null, anchor?: { top: number; right: number }) => void
}) {
  const [hovered, setHovered] = useState(false)
  const menuOpen = openMenuId === notebook.id

  return (
    <div
      style={{
        position: 'relative',
        padding: '14px 20px',
        background: W,
        border: hovered || menuOpen ? `2px solid ${G}` : `2px solid ${B}`,
        boxShadow: hovered || menuOpen ? `6px 6px 0 ${B}` : `3px 3px 0 ${B}`,
        transform: hovered || menuOpen ? 'translate(-2px, -2px)' : 'none',
        transition: 'transform 0.1s, box-shadow 0.1s, border-color 0.1s',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Pin icon */}
      <div style={{ width: 14, flexShrink: 0 }}>
        {notebook.pinned && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill={G}>
            <path d="M9 1H3a1 1 0 0 0-1 1v1.5l2 2V10l2 1 2-1V5.5l2-2V2a1 1 0 0 0-1-1Z" />
          </svg>
        )}
      </div>

      {/* Title */}
      <div
        style={{
          flex: 1,
          fontFamily: "'Syne', sans-serif",
          fontWeight: 700,
          fontSize: '0.9rem',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          minWidth: 0,
        }}
      >
        {notebook.title}
      </div>

      {/* File count */}
      <span
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.62rem',
          color: '#888',
          flexShrink: 0,
        }}
      >
        {notebook.file_count} files
      </span>

      {/* Date */}
      <span
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.62rem',
          color: '#888',
          flexShrink: 0,
        }}
      >
        {formatDate(notebook.created_at)}
      </span>

      {/* Three-dot */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          if (menuOpen) { onMenuOpen(null); return }
          const rect = e.currentTarget.getBoundingClientRect()
          onMenuOpen(notebook.id, { top: rect.bottom + 4, right: window.innerWidth - rect.right })
        }}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0 2px',
          fontSize: '1rem',
          lineHeight: 1,
          color: '#888',
          opacity: hovered || menuOpen ? 1 : 0,
          transition: 'opacity 0.1s',
          flexShrink: 0,
        }}
      >
        ⋮
      </button>
    </div>
  )
}

// ── Create Row (list) ──────────────────────────────────────────────
function CreateRow() {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={() => console.log('Create new notebook clicked')}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '14px 20px',
        border: hovered ? `2px dashed ${G}` : `2px dashed ${B}`,
        background: W,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        cursor: 'pointer',
        transition: 'border-color 0.1s',
      }}
    >
      <span style={{ fontSize: '1.1rem', color: '#aaa', lineHeight: 1 }}>+</span>
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

// ── Main Dashboard ─────────────────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate()
  const loggedIn = isLoggedIn()
  const user = getUser()
  const [notebooks, setNotebooks] = useState<Notebook[]>([])
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<{ top: number; right: number } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const contentRef = useRef<HTMLDivElement>(null)

  function handleMenuOpen(id: number | null, anchor?: { top: number; right: number }) {
    setOpenMenuId(id)
    setMenuAnchor(anchor ?? null)
  }

  useEffect(() => {
    seedNotebooks()
    setNotebooks(getNotebooks())
  }, [])

  // Click-outside handler to close menu
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (openMenuId !== null) {
        setOpenMenuId(null)
        setMenuAnchor(null)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [openMenuId])

  function handleLogout() {
    endSession()
    navigate('/login')
  }

  function refreshNotebooks() {
    setNotebooks(getNotebooks())
  }

  const sorted = [...notebooks].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  if (!loggedIn) return <Navigate to="/login" replace />

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <Sidebar onLogout={handleLogout} userEmail={user?.email ?? ''} />

      {/* ── Main content ── */}
      <div
        ref={contentRef}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: '#f5f5f0',
          minWidth: 0,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px 32px 16px',
            borderBottom: `2px solid ${B}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
            background: W,
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: '1.6rem',
                letterSpacing: '-0.02em',
                margin: 0,
                lineHeight: 1.1,
              }}
            >
              My Notebooks
            </h1>
            <p
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.7rem',
                color: '#888',
                margin: '4px 0 0',
              }}
            >
              {notebooks.length} notebooks
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Search (decorative) */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notebooks..."
                style={{
                  border: `2px solid ${B}`,
                  borderRadius: 0,
                  padding: '8px 12px 8px 32px',
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '0.72rem',
                  background: W,
                  outline: 'none',
                  width: 200,
                }}
              />
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              >
                <circle cx="6" cy="6" r="4.5" stroke="#aaa" strokeWidth="1.5" />
                <path d="M10 10l2.5 2.5" stroke="#aaa" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>

            {/* Grid/List toggle */}
            <div style={{ display: 'flex', border: `2px solid ${B}` }}>
              <button
                onClick={() => setView('grid')}
                style={{
                  background: view === 'grid' ? B : W,
                  color: view === 'grid' ? W : B,
                  border: 'none',
                  padding: '8px 10px',
                  cursor: 'pointer',
                  lineHeight: 1,
                }}
                title="Grid view"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                  <rect x="0" y="0" width="6" height="6" />
                  <rect x="8" y="0" width="6" height="6" />
                  <rect x="0" y="8" width="6" height="6" />
                  <rect x="8" y="8" width="6" height="6" />
                </svg>
              </button>
              <button
                onClick={() => setView('list')}
                style={{
                  background: view === 'list' ? B : W,
                  color: view === 'list' ? W : B,
                  border: 'none',
                  borderLeft: `1px solid ${B}`,
                  padding: '8px 10px',
                  cursor: 'pointer',
                  lineHeight: 1,
                }}
                title="List view"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                  <rect x="0" y="0" width="14" height="2.5" />
                  <rect x="0" y="5.75" width="14" height="2.5" />
                  <rect x="0" y="11.5" width="14" height="2.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div
          className="freshr-scroll"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 32px',
          }}
        >
          {view === 'grid' ? (
            <div
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
              style={{ gap: 20 }}
            >
              <CreateCard />
              {sorted.map((nb) => (
                <NotebookCard
                  key={nb.id}
                  notebook={nb}
                  openMenuId={openMenuId}
                  onMenuOpen={handleMenuOpen}
                />
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <CreateRow />
              {sorted.map((nb) => (
                <NotebookRow
                  key={nb.id}
                  notebook={nb}
                  openMenuId={openMenuId}
                  onMenuOpen={handleMenuOpen}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Portal menu — renders outside overflow-clipped containers */}
      {openMenuId !== null && menuAnchor !== null && (() => {
        const nb = notebooks.find((n) => n.id === openMenuId)
        if (!nb) return null
        return createPortal(
          <NotebookMenu
            notebook={nb}
            top={menuAnchor.top}
            right={menuAnchor.right}
            onPin={() => { updateNotebook(nb.id, { pinned: !nb.pinned }); refreshNotebooks(); handleMenuOpen(null); console.log('Pin/Unpin', nb.id) }}
            onRename={() => { handleMenuOpen(null); console.log('Rename', nb.id) }}
            onArchive={() => { handleMenuOpen(null); console.log('Archive', nb.id) }}
            onDelete={() => { handleMenuOpen(null); console.log('Delete', nb.id) }}
          />,
          document.body
        )
      })()}
    </div>
  )
}
