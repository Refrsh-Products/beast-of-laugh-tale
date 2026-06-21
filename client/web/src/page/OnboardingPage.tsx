import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import useAuthService from "../services/auth";
import useAccountService from "../services/account";
import type { OnboardingStatus } from "@freshr/shared";
import FreshrLogo from "../components/logo/FreshrLogo";
import LoadErrorScreen from "../components/ui/LoadErrorScreen";
import { getGoogleProfile, clearGoogleProfile } from "../storage";
import Button from "../components/ui/Button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { cn } from "../lib/utils";

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
  const [showErrors, setShowErrors] = useState(false);
  const [status, setStatus] = useState<OnboardingStatus | "loading">("loading");
  const [retrying, setRetrying] = useState(false);

  async function checkStatus() {
    setRetrying(true);
    const next = await accountService.getOnboardingStatus();
    setStatus(next);
    setRetrying(false);
  }

  useEffect(() => {
    if (!authService.isLoggedIn()) return;
    checkStatus();
  }, []);

  if (!authService.isLoggedIn()) return <Navigate to="/login" replace />;
  if (status === "loading") return null;
  if (status === "error") {
    return <LoadErrorScreen onRetry={checkStatus} retrying={retrying} />;
  }
  if (status === "complete") return <Navigate to="/dashboard" replace />;

  async function handleSubmit() {
    setError("");
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !phone.trim() ||
      !address1.trim() ||
      !city.trim() ||
      !postalCode.trim()
    ) {
      setShowErrors(true);
      setError("Please fill in all required fields.");
      return;
    }
    setShowErrors(false);
    try {
      await accountService.updateAccount({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        address1: address1.trim(),
        address2: address2.trim() || "",
        city: city.trim(),
        postal_code: postalCode.trim(),
        profile_picture_url: googleProfile?.profile_picture_url,
        onboarding_completed: true,
      });
      clearGoogleProfile();
      navigate("/dashboard");
    } catch {
      setError("Failed to save your profile. Please try again.");
    }
  }

  const fieldError = (val: string) =>
    showErrors && !val.trim() ? "border-destructive focus:ring-destructive" : "";

  return (
    <div className="min-h-dvh bg-background flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md flex flex-col gap-6">
        <FreshrLogo />

        <div>
          <h1 className="text-xl font-semibold text-foreground">One last step</h1>
          <p className="text-sm text-muted-foreground mt-1">Tell us a bit about yourself to complete your profile.</p>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <form
          onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
          className="flex flex-col gap-4"
        >
          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <Label htmlFor="firstName">First name <span className="text-destructive">*</span></Label>
              <Input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jane"
                className={cn(fieldError(firstName))}
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <Label htmlFor="lastName">Last name <span className="text-destructive">*</span></Label>
              <Input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Smith"
                className={cn(fieldError(lastName))}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">Phone number <span className="text-destructive">*</span></Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^\d+\-\s().]/g, ""))}
              placeholder="+1 (555) 000-0000"
              className={cn(fieldError(phone))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="address1">Address line 1 <span className="text-destructive">*</span></Label>
            <Input
              id="address1"
              type="text"
              value={address1}
              onChange={(e) => setAddress1(e.target.value)}
              placeholder="123 Main St"
              className={cn(fieldError(address1))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="address2">
              Address line 2 <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="address2"
              type="text"
              value={address2}
              onChange={(e) => setAddress2(e.target.value)}
              placeholder="Apt 4B"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <Label htmlFor="city">City <span className="text-destructive">*</span></Label>
              <Input
                id="city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="New York"
                className={cn(fieldError(city))}
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <Label htmlFor="postalCode">Postal code <span className="text-destructive">*</span></Label>
              <Input
                id="postalCode"
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="1234"
                className={cn(fieldError(postalCode))}
              />
            </div>
          </div>

          <Button variant="green" fullWidth type="submit">
            Go to dashboard →
          </Button>
        </form>
      </div>
    </div>
  );
}
