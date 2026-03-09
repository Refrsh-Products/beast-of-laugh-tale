import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { isLoggedIn, hasCompletedOnboarding, saveAccount } from './storage'

const G = '#84e487'
const B = '#000000'
const W = '#FFFFFF'

export default function OnboardingPage() {
  const navigate = useNavigate()

  if (!isLoggedIn()) return <Navigate to="/login" replace />
  if (hasCompletedOnboarding()) return <Navigate to="/dashboard" replace />

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim() || !phone.trim() || !address.trim()) {
      setError('Please fill in all fields.')
      return
    }
    saveAccount({ name: name.trim(), phone: phone.trim(), address: address.trim() })
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
    color: B,
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f5f5f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          background: W,
          border: `2px solid ${B}`,
          boxShadow: `8px 8px 0 ${B}`,
          padding: '40px 40px 36px',
          boxSizing: 'border-box',
        }}
      >
        {/* Logo */}
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: '1.1rem',
            letterSpacing: '-0.02em',
            color: G,
            marginBottom: 24,
          }}
        >
          FRESHR
        </div>

        <h1
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: '1.75rem',
            letterSpacing: '-0.02em',
            margin: '0 0 8px',
            lineHeight: 1.1,
            color: B,
          }}
        >
          One last step
        </h1>
        <p
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.72rem',
            color: '#666',
            margin: '0 0 32px',
            lineHeight: 1.6,
          }}
        >
          Tell us a bit about yourself to complete your profile.
        </p>

        {error && (
          <p
            style={{
              color: '#cc0000',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.72rem',
              margin: '0 0 20px',
            }}
          >
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={labelStyle}>FULL NAME</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Smith"
              style={inputStyle}
              autoFocus
            />
          </div>

          <div>
            <label style={labelStyle}>PHONE NUMBER</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>ADDRESS</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St, City, Country"
              style={inputStyle}
            />
          </div>

          <div style={{ marginTop: 8 }}>
            <button
              type="submit"
              style={{
                width: '100%',
                background: G,
                color: B,
                border: `2px solid ${B}`,
                boxShadow: `4px 4px 0 ${B}`,
                padding: '14px 22px',
                fontSize: '0.78rem',
                fontFamily: "'IBM Plex Mono', monospace",
                fontWeight: 600,
                letterSpacing: '0.08em',
                cursor: 'pointer',
                lineHeight: 1,
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
              Go to dashboard →
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
