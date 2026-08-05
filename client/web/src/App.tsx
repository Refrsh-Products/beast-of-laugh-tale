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
import VerifyEmailPage from "./page/VerifyEmailPage";
import VerifyEmailSentPage from "./page/VerifyEmailSentPage";
import ProfilePage from "./page/ProfilePage";
import NotebookPage from "./page/NotebookPage";
import NotFoundPage from "./page/NotFoundPage";
import PaymentSuccessPage from "./page/PaymentSuccessPage";
import PaymentCancelPage from "./page/PaymentCancelPage";
import SupportPage from "./page/SupportPage";
import PolicyPage from "./page/PolicyPage";
import { Toaster } from "@/components/ui/sonner";

export default function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_AUTH_CLIENT_ID}>
      <Toaster position="bottom-center" />
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
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/verify-email/sent" element={<VerifyEmailSentPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/payment/success" element={<PaymentSuccessPage />} />
          <Route path="/payment/cancel" element={<PaymentCancelPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/notebook/:id" element={<NotebookPage />} />
          <Route
            path="/privacy-policy"
            element={<PolicyPage policy="privacy" />}
          />
          <Route
            path="/terms-of-service"
            element={<PolicyPage policy="terms" />}
          />
          <Route
            path="/refund-policy"
            element={<PolicyPage policy="refund" />}
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}
