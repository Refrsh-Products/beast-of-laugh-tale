import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './LandingPage'
import SignupPage from './SignupPage'
import LoginPage from './LoginPage'
import DashboardPage from './DashboardPage'
import OnboardingPage from './OnboardingPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </BrowserRouter>
  )
}
