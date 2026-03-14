import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import LandingPage from "./page/LandingPage";
import SignupPage from "./page/SignupPage";
import LoginPage from "./page/LoginPage";
import DashboardPage from "./page/DashboardPage";
import OnboardingPage from "./page/OnboardingPage";
import ForgotPasswordPage from "./page/ForgotPasswordPage";
import ForgotPasswordSentPage from "./page/ForgotPasswordSentPage";
import ResetPasswordPage from "./page/ResetPasswordPage";
import ProfilePage from "./page/ProfilePage";
import NotebookPage from "./page/NotebookPage";

export default function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_AUTH_CLIENT_ID}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route
            path="/forgot-password/sent"
            element={<ForgotPasswordSentPage />}
          />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/notebook/:id" element={<NotebookPage />} />
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}
