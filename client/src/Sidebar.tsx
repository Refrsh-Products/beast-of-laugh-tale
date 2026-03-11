import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import ProfileMenuItem from './components/sidebar/ProfileMenuItem'

const G = '#84e487'
const B = '#000000'
const W = '#FFFFFF'

interface SidebarProps {
  onLogout: () => void
  userEmail: string
  userName?: string
}

export default function Sidebar({ onLogout, userEmail, userName }: SidebarProps) {
  const displayLabel = userName || userEmail
  const avatarLetter = (userName || userEmail || '?')[0].toUpperCase()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<{ bottom: number; left: number; width: number } | null>(null)
  const profileRowRef = useRef<HTMLDivElement>(null)

  // Close profile dropdown on outside click
  useEffect(() => {
    if (!profileMenuAnchor) return
    function handler(e: MouseEvent) {
      if (profileRowRef.current && !profileRowRef.current.contains(e.target as Node)) {
        setProfileMenuAnchor(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [profileMenuAnchor])

  function toggleProfileMenu() {
    if (profileMenuAnchor) { setProfileMenuAnchor(null); return }
    const el = profileRowRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setProfileMenuAnchor({ bottom: window.innerHeight - rect.top + 4, left: rect.left, width: rect.width })
  }

  return (
    <div
      style={{
        width: collapsed ? 60 : 240,
        minWidth: collapsed ? 60 : 240,
        transition: 'width 0.2s ease, min-width 0.2s ease',
        height: '100vh',
        position: 'sticky',
        top: 0,
        background: B,
        color: W,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRight: `2px solid ${B}`,
        flexShrink: 0,
      }}
    >
      {/* ── Top section ── */}
      <div
        style={{
          padding: collapsed ? '20px 0' : '20px 16px',
          borderBottom: '1px solid #222',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: 8,
          flexShrink: 0,
        }}
      >
        {!collapsed && (
          <div
            onClick={() => navigate('/')}
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: '1.25rem',
              letterSpacing: '-0.02em',
              color: G,
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            FRESHR
          </div>
        )}
        <button
          onClick={() => setCollapsed((v) => !v)}
          style={{
            background: 'none',
            border: 'none',
            color: '#888',
            cursor: 'pointer',
            fontSize: '0.75rem',
            padding: 4,
            lineHeight: 1,
            flexShrink: 0,
          }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      {/* ── Middle section (notebooks) ── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: collapsed ? '16px 0' : '16px',
        }}
      >
        {!collapsed && (
          <>
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.6rem',
                fontWeight: 700,
                letterSpacing: '0.14em',
                color: '#555',
                marginBottom: 12,
              }}
            >
              NOTEBOOKS
            </div>
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.68rem',
                color: '#444',
                lineHeight: 1.5,
              }}
            >
              Open a notebook to see it here
            </div>
          </>
        )}
        {collapsed && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            {/* Folder icon placeholder */}
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M2 5a2 2 0 0 1 2-2h3.586a1 1 0 0 1 .707.293L9.707 4.707A1 1 0 0 0 10.414 5H16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5Z"
                stroke="#444"
                strokeWidth="1.5"
                fill="none"
              />
            </svg>
          </div>
        )}
      </div>

      {/* ── Bottom section ── */}
      <div
        style={{
          borderTop: '1px solid #222',
          flexShrink: 0,
        }}
      >
        {/* Profile row — click to open dropdown */}
        <div
          ref={profileRowRef}
          onClick={toggleProfileMenu}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: collapsed ? '14px 0' : '14px 16px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            cursor: 'pointer',
            userSelect: 'none',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = '#111' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
        >
          {/* Avatar */}
          <div
            style={{
              width: 28,
              height: 28,
              background: profileMenuAnchor ? W : G,
              color: profileMenuAnchor ? B : B,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: '0.7rem',
              flexShrink: 0,
              transition: 'background 0.1s',
              border: profileMenuAnchor ? `2px solid ${G}` : 'none',
            }}
          >
            {avatarLetter}
          </div>

          {!collapsed && (
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.68rem',
                color: '#888',
                flex: 1,
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {displayLabel}
            </span>
          )}
        </div>
      </div>

      {/* Profile dropdown portal */}
      {profileMenuAnchor && createPortal(
        <div
          style={{
            position: 'fixed',
            bottom: profileMenuAnchor.bottom,
            left: profileMenuAnchor.left,
            minWidth: Math.max(profileMenuAnchor.width, 160),
            zIndex: 1000,
            background: W,
            border: `2px solid ${B}`,
            boxShadow: `4px 4px 0 ${B}`,
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <ProfileMenuItem
            label="Settings"
            onClick={() => { setProfileMenuAnchor(null); console.log('Settings clicked') }}
          />
          <div style={{ height: 1, background: '#eee' }} />
          <ProfileMenuItem
            label="Logout"
            color="#cc0000"
            onClick={() => { setProfileMenuAnchor(null); onLogout() }}
          />
        </div>,
        document.body
      )}
    </div>
  )
}

