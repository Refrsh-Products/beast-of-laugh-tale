import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getUser, getPassword, startSession } from './storage'

const G = '#84e487'
const B = '#000000'
const W = '#FFFFFF'

function Btn({
  children,
  variant = 'green',
  lg,
  fullWidth,
  onClick,
  type = 'button',
}: {
  children: React.ReactNode
  variant?: 'green' | 'black' | 'outline'
  lg?: boolean
  fullWidth?: boolean
  onClick?: () => void
  type?: 'button' | 'submit'
}) {
  const [down, setDown] = useState(false)
  const bg = variant === 'black' ? B : variant === 'green' ? G : W
  const txt = variant === 'black' ? W : B

  return (
    <button
      type={type}
      onClick={onClick}
      style={{
        background: bg,
        color: txt,
        border: `2px solid ${B}`,
        boxShadow: down ? `2px 2px 0 ${B}` : `4px 4px 0 ${B}`,
        transform: down ? 'translate(2px, 2px)' : 'none',
        padding: lg ? '16px 36px' : '12px 22px',
        fontSize: '0.78rem',
        fontFamily: "'IBM Plex Mono', monospace",
        fontWeight: 600,
        letterSpacing: '0.08em',
        cursor: 'pointer',
        transition: 'transform 0.08s, box-shadow 0.08s',
        lineHeight: 1,
        width: fullWidth ? '100%' : undefined,
      }}
      onMouseDown={() => setDown(true)}
      onMouseUp={() => setDown(false)}
      onMouseLeave={() => setDown(false)}
    >
      {children}
    </button>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email || !password) {
      setError('Please fill in all fields.')
      return
    }
    const storedUser = getUser()
    const storedPassword = getPassword()
    if (!storedUser || storedPassword === null) {
      setError('No account found. Please sign up first.')
      return
    }
    if (storedUser.email !== email || storedPassword !== password) {
      setError('Incorrect email or password.')
      return
    }
    startSession()
    navigate('/dashboard')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    border: `3px solid ${B}`,
    borderRadius: 0,
    padding: '12px 14px',
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: '0.82rem',
    background: W,
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: '0.68rem',
    fontWeight: 700,
    letterSpacing: '0.12em',
    marginBottom: 6,
  }

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        fontFamily: "'IBM Plex Mono', monospace",
      }}
    >
      {/* ── LEFT HALF (form) ── */}
      <div
        style={{
          flex: '0 0 50%',
          background: W,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '48px 32px',
          position: 'relative',
          boxSizing: 'border-box',
        }}
      >
        {/* Logo */}
        <div
          style={{
            position: 'absolute',
            top: 32,
            left: 36,
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: '1.5rem',
            letterSpacing: '-0.02em',
            color: B,
            cursor: 'pointer',
          }}
          onClick={() => navigate('/')}
        >
          FRESHR
        </div>

        {/* Form container */}
        <div style={{ width: '100%', maxWidth: 420 }}>
          <h1
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: '2rem',
              letterSpacing: '-0.02em',
              marginBottom: 32,
              lineHeight: 1.1,
            }}
          >
            Welcome<br />back
          </h1>

          {/* Google button */}
          <button
            style={{
              width: '100%',
              background: W,
              border: `2px solid ${B}`,
              boxShadow: `4px 4px 0 ${B}`,
              padding: '12px 22px',
              fontFamily: "'IBM Plex Mono', monospace",
              fontWeight: 600,
              fontSize: '0.78rem',
              letterSpacing: '0.08em',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              marginBottom: 24,
            }}
            onMouseDown={(e) => {
              const el = e.currentTarget
              el.style.boxShadow = `2px 2px 0 ${B}`
              el.style.transform = 'translate(2px, 2px)'
            }}
            onMouseUp={(e) => {
              const el = e.currentTarget
              el.style.boxShadow = `4px 4px 0 ${B}`
              el.style.transform = 'none'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget
              el.style.boxShadow = `4px 4px 0 ${B}`
              el.style.transform = 'none'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 24,
            }}
          >
            <div style={{ flex: 1, height: 2, background: B }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', color: '#666' }}>
              or
            </span>
            <div style={{ flex: 1, height: 2, background: B }} />
          </div>

          {/* Error message */}
          {error && (
            <p
              style={{
                color: '#cc0000',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.72rem',
                margin: '0 0 16px',
              }}
            >
              {error}
            </p>
          )}

          {/* Fields */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>EMAIL</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>PASSWORD</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ ...inputStyle, paddingRight: 48 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    color: '#888',
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                  }}
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>

            <div style={{ marginTop: 8 }}>
              <Btn variant="green" fullWidth type="submit">
                Log in →
              </Btn>
            </div>
          </form>

          {/* Footer */}
          <p
            style={{
              marginTop: 28,
              fontSize: '0.75rem',
              color: '#555',
              textAlign: 'center',
            }}
          >
            Don't have an account?{' '}
            <Link
              to="/signup"
              style={{
                color: B,
                fontWeight: 700,
                textDecoration: 'underline',
                textUnderlineOffset: 3,
              }}
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* ── RIGHT HALF (black) ── */}
      <div
        style={{
          flex: '0 0 50%',
          boxSizing: 'border-box',
          background: B,
          display: 'none',
          position: 'relative',
        }}
        className="login-right"
      >
      </div>

      <style>{`
        @media (min-width: 768px) {
          .login-right { display: block !important; }
        }
      `}</style>
    </div>
  )
}
