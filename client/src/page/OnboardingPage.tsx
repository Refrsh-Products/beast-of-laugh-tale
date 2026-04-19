import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import useAuthService from "../services/auth";
import useAccountService from "../services/account";
import FreshrLogo from "../components/logo/FreshrLogo";
import { getGoogleProfile, clearGoogleProfile } from "../storage";
import Button from "../components/ui/Button";

const G = "#84e487";
const B = "#000000";
const W = "#FFFFFF";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const authService = useAuthService();
  const accountService = useAccountService();
  const googleProfile = getGoogleProfile();
  const [firstName, setFirstName] = useState(googleProfile?.first_name ?? "");
  const [lastName, setLastName] = useState(googleProfile?.last_name ?? "");
  const [phone, setPhone] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [error, setError] = useState("");
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(
    null,
  );

  useEffect(() => {
    if (!authService.isLoggedIn()) return;
    accountService.hasCompletedOnboarding().then(setOnboardingComplete);
  }, []);

  if (!authService.isLoggedIn()) return <Navigate to="/login" replace />;
  if (onboardingComplete === null) return null;
  if (onboardingComplete) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !phone.trim() ||
      !address1.trim() ||
      !city.trim() ||
      !postalCode.trim()
    ) {
      setError("Please fill in all required fields.");
      return;
    }
    try {
      const existingAccount = accountService.getAccount();
      await accountService.saveAccount({
        id: existingAccount?.id ?? sessionStorage.getItem("userId") ?? "",
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        address1: address1.trim(),
        address2: address2.trim() || "",
        city: city.trim(),
        postal_code: postalCode.trim(),
        profile_picture_url: googleProfile?.profile_picture_url,
        tier_plan: (existingAccount?.tier_plan ?? "FREE") as any,
      });
      clearGoogleProfile();
      navigate("/dashboard");
    } catch {
      setError("Failed to save your profile. Please try again.");
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    border: `3px solid ${B}`,
    borderRadius: 0,
    padding: "12px 14px",
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "0.82rem",
    background: W,
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "0.68rem",
    fontWeight: 700,
    letterSpacing: "0.12em",
    marginBottom: 6,
    color: B,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f5f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          background: W,
          border: `2px solid ${B}`,
          boxShadow: `8px 8px 0 ${B}`,
          padding: "40px 40px 36px",
          boxSizing: "border-box",
        }}
      >
        {/* Logo */}
        <FreshrLogo />

        <h1
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: "1.75rem",
            letterSpacing: "-0.02em",
            margin: "0 0 8px",
            lineHeight: 1.1,
            color: B,
          }}
        >
          One last step
        </h1>
        <p
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.72rem",
            color: "#666",
            margin: "0 0 32px",
            lineHeight: 1.6,
          }}
        >
          Tell us a bit about yourself to complete your profile.
        </p>

        {error && (
          <p
            style={{
              color: "#cc0000",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.72rem",
              margin: "0 0 20px",
            }}
          >
            {error}
          </p>
        )}

        <form style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>FIRST NAME</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jane"
                style={inputStyle}
                autoFocus
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>LAST NAME</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Smith"
                style={inputStyle}
              />
            </div>
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
            <label style={labelStyle}>ADDRESS LINE 1</label>
            <input
              type="text"
              value={address1}
              onChange={(e) => setAddress1(e.target.value)}
              placeholder="123 Main St"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>
              ADDRESS LINE 2{" "}
              <span style={{ fontWeight: 400, opacity: 0.5 }}>(OPTIONAL)</span>
            </label>
            <input
              type="text"
              value={address2}
              onChange={(e) => setAddress2(e.target.value)}
              placeholder="Apt 4B"
              style={inputStyle}
            />
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>CITY</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="New York"
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>POSTAL CODE</label>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="10001"
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginTop: 8 }}>
            <Button variant="green" fullWidth onClick={handleSubmit}>
              Go to dashboard →
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
