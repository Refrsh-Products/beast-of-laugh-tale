import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './LandingPage'
import SignupPage from './SignupPage'

function LoginPage() {
  return <div style={{ fontFamily: "'IBM Plex Mono', monospace", padding: 40 }}>Login page coming soon.</div>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  )
}
