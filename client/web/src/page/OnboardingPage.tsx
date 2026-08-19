import { useId, useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import useAuthService from "../services/auth";
import useAccountService from "../services/account";
import type { OnboardingStatus } from "@freshr/shared";
import FreshrLogo from "../components/logo/FreshrLogo";
import LoadErrorScreen from "../components/ui/LoadErrorScreen";
import { getGoogleProfile, clearGoogleProfile } from "../storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * One labelled input. Required fields mark themselves with aria-invalid once
 * the form has been submitted empty, which drives both the red outline (via
 * the Input variant) and the announcement — the old version painted the
 * border directly and told assistive tech nothing.
 *
 * Deliberately `aria-required` rather than the native `required` attribute:
 * this form validates in JS so it can show one combined message and mark
 * every offending field at once. A native `required` would make the browser
 * block submission first with its own single-field tooltip, and handleSubmit
 * would never run.
 */
function Field({
  label,
  required = false,
  invalid = false,
  ...props
}: {
  label: string;
  required?: boolean;
  invalid?: boolean;
} & React.ComponentProps<typeof Input>) {
  const id = useId();
  return (
    <div className="flex-1">
      <Label
        htmlFor={id}
        className="text-muted-foreground mb-1.5 text-xs font-semibold tracking-[0.12em] uppercase"
      >
        {label}{" "}
        {required ? (
          <span className="text-destructive" aria-hidden="true">
            *
          </span>
        ) : (
          <span className="font-normal opacity-60">(optional)</span>
        )}
      </Label>
      <Input
        id={id}
        aria-required={required || undefined}
        aria-invalid={invalid}
        {...props}
      />
    </div>
  );
}

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

  const missing = (value: string) => showErrors && !value.trim();

  return (
    <div className="bg-background flex min-h-dvh items-center justify-center p-4 sm:p-8">
      <div className="bg-card ring-foreground/5 w-full max-w-120 rounded-3xl p-8 shadow-lg ring-1 sm:p-10">
        <div className="mb-6">
          <FreshrLogo />
        </div>

        <h1 className="font-heading text-foreground mb-2 text-2xl leading-tight font-bold tracking-tight">
          One last step
        </h1>
        <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
          Tell us a bit about yourself to complete your profile.
        </p>

        {error && (
          <p role="alert" className="text-destructive mb-5 text-sm">
            {error}
          </p>
        )}

        <form
          className="flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:gap-3">
            <Field
              label="First name"
              required
              invalid={missing(firstName)}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Jane"
              autoComplete="given-name"
              autoFocus
            />
            <Field
              label="Last name"
              required
              invalid={missing(lastName)}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Smith"
              autoComplete="family-name"
            />
          </div>

          <Field
            label="Phone number"
            required
            invalid={missing(phone)}
            type="tel"
            value={phone}
            onChange={(e) =>
              setPhone(e.target.value.replace(/[^\d+\-\s().]/g, ""))
            }
            placeholder="+1 (555) 000-0000"
            autoComplete="tel"
          />

          <Field
            label="Address line 1"
            required
            invalid={missing(address1)}
            value={address1}
            onChange={(e) => setAddress1(e.target.value)}
            placeholder="123 Main St"
            autoComplete="address-line1"
          />

          <Field
            label="Address line 2"
            value={address2}
            onChange={(e) => setAddress2(e.target.value)}
            placeholder="Apt 4B"
            autoComplete="address-line2"
          />

          <div className="flex flex-col gap-5 sm:flex-row sm:gap-3">
            <Field
              label="City"
              required
              invalid={missing(city)}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="New York"
              autoComplete="address-level2"
            />
            <Field
              label="Postal code"
              required
              invalid={missing(postalCode)}
              value={postalCode}
              onChange={(e) =>
                setPostalCode(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              placeholder="1234"
              autoComplete="postal-code"
            />
          </div>

          <Button type="submit" size="lg" className="mt-2 w-full">
            Go to dashboard
          </Button>
        </form>
      </div>
    </div>
  );
}
