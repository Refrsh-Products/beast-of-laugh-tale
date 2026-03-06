import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const G = '#84e487'
const B = '#000000'
const W = '#FFFFFF'

interface SidebarProps {
  onLogout: () => void
  userEmail: string
}

export default function Sidebar({ onLogout, userEmail }: SidebarProps) {
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [logoutHovered, setLogoutHovered] = useState(false)

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
        {/* Settings row */}
        <div
          onClick={() => console.log('Settings clicked')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: collapsed ? '14px 0' : '14px 16px',
            cursor: 'pointer',
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderBottom: '1px solid #222',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = '#111' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
            <path
              d="M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
              stroke="#888"
              strokeWidth="1.4"
              fill="none"
            />
            <path
              d="M13.3 8c0-.2 0-.4-.02-.6l1.3-1a.5.5 0 0 0 .1-.6l-1.22-2.1a.5.5 0 0 0-.6-.22l-1.53.62a4.6 4.6 0 0 0-1.04-.6L10.08 2a.5.5 0 0 0-.5-.42H7.42A.5.5 0 0 0 6.92 2l-.22 1.54c-.38.16-.72.37-1.04.6L4.14 3.52a.5.5 0 0 0-.6.22L2.32 5.84a.5.5 0 0 0 .1.6l1.3 1A4.6 4.6 0 0 0 3.7 8c0 .2 0 .4.02.6l-1.3 1a.5.5 0 0 0-.1.6l1.22 2.1c.12.22.38.3.6.22l1.53-.62c.32.23.66.44 1.04.6l.22 1.54c.06.24.27.42.5.42h2.16c.23 0 .44-.18.5-.42l.22-1.54c.38-.16.72-.37 1.04-.6l1.53.62c.22.08.48 0 .6-.22l1.22-2.1a.5.5 0 0 0-.1-.6l-1.3-1c.02-.2.02-.4.02-.6Z"
              stroke="#888"
              strokeWidth="1.4"
              fill="none"
            />
          </svg>
          {!collapsed && (
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.72rem',
                color: '#888',
              }}
            >
              Settings
            </span>
          )}
        </div>

        {/* Profile row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: collapsed ? '14px 0' : '14px 16px',
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: 28,
              height: 28,
              background: G,
              color: B,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: '0.7rem',
              flexShrink: 0,
            }}
          >
            {userEmail ? userEmail[0].toUpperCase() : '?'}
          </div>

          {!collapsed && (
            <>
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
                {userEmail}
              </span>
              <button
                onClick={onLogout}
                onMouseEnter={() => setLogoutHovered(true)}
                onMouseLeave={() => setLogoutHovered(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: logoutHovered ? '#cc0000' : '#666',
                  padding: '4px 0',
                  flexShrink: 0,
                  transition: 'color 0.1s',
                }}
              >
                LOGOUT
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
