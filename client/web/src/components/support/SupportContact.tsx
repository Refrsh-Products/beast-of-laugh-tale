import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { sendSupportEmail } from "../../lib/supportEmail";
import { POLICY_LINKS } from "../../constants/policies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/**
 * The support contact block: business details plus the "send us a message"
 * form.
 *
 * This markup existed twice — once on the public /support page and once inside
 * the profile page's Support tab — with the business constants copy-pasted
 * between them, so a change to the phone number had to be made in two files.
 */

export const SUPPORT_EMAIL = "team@freshr.cc";

const BUSINESS_ADDRESS_LINES = [
  "Ground floor, Setara's Dream, 1/11 Pallabi Mirpur",
];
const BUSINESS_PHONE = "+8801813884557 +8801873070777";
const BUSINESS_HOURS = "Sun–Thu, 10:00–18:00 (GMT+6)";

const CARD_LABEL =
  "text-muted-foreground mb-1.5 text-xs font-semibold tracking-[0.14em] uppercase";

function ContactCard({
  label,
  accent = false,
  children,
}: {
  label: string;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={
        accent
          ? "bg-secondary text-secondary-foreground rounded-2xl p-4"
          : "border-border bg-card text-card-foreground rounded-2xl border p-4"
      }
    >
      <div className={accent ? `${CARD_LABEL} text-current/70` : CARD_LABEL}>
        {label}
      </div>
      {children}
    </div>
  );
}

export function SupportDetails() {
  return (
    <div className="mb-7 grid gap-3.5 sm:grid-cols-2">
      <ContactCard label="Email" accent>
        <span className="text-base font-bold break-all">{SUPPORT_EMAIL}</span>
      </ContactCard>

      <ContactCard label="Phone">
        <span className="text-foreground text-base font-bold">
          {BUSINESS_PHONE}
        </span>
      </ContactCard>

      <ContactCard label="Business hours">
        <p className="text-foreground text-sm leading-relaxed font-medium">
          {BUSINESS_HOURS}
        </p>
      </ContactCard>

      <ContactCard label="Address">
        <address className="text-foreground text-sm leading-relaxed not-italic">
          {BUSINESS_ADDRESS_LINES.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </address>
      </ContactCard>
    </div>
  );
}

export function SupportForm({
  defaultName = "",
  defaultEmail = "",
}: {
  defaultName?: string;
  defaultEmail?: string;
}) {
  const ids = {
    name: useId(),
    email: useId(),
    mobile: useId(),
    message: useId(),
  };
  const [fullName, setFullName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [mobile, setMobile] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !mobile.trim() || !message.trim()) {
      setError("Please fill in every field.");
      return;
    }
    setError("");
    setIsSending(true);
    try {
      await sendSupportEmail({ fullName, email, mobile, message });
      setSent(true);
      setMobile("");
      setMessage("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not send your message. Please try again.",
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="border-border bg-card rounded-3xl border p-6 sm:p-7">
      <h2 className="font-heading text-foreground mb-5 text-xl font-bold tracking-tight">
        Send us a message
      </h2>

      {error && (
        <p role="alert" className="text-destructive mb-4 text-sm">
          {error}
        </p>
      )}

      {sent && (
        <div
          role="status"
          className="bg-secondary text-secondary-foreground mb-4 rounded-2xl px-4 py-3 text-sm font-semibold"
        >
          Message sent. We'll get back to you soon.
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <div>
          <Label htmlFor={ids.name} className="mb-1.5">
            Full name
          </Label>
          <Input
            id={ids.name}
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jane Doe"
            autoComplete="name"
          />
        </div>

        <div>
          <Label htmlFor={ids.email} className="mb-1.5">
            Email
          </Label>
          <Input
            id={ids.email}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>

        <div>
          <Label htmlFor={ids.mobile} className="mb-1.5">
            Mobile number
          </Label>
          <Input
            id={ids.mobile}
            type="tel"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="+880 1XXX-XXXXXX"
            autoComplete="tel"
          />
        </div>

        <div>
          <Label htmlFor={ids.message} className="mb-1.5">
            Message
          </Label>
          <Textarea
            id={ids.message}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us how we can help..."
            rows={5}
          />
        </div>

        <Button
          type="submit"
          size="lg"
          className="mt-1.5 w-full"
          disabled={isSending}
        >
          {isSending ? "Sending…" : "Send message"}
        </Button>

        <p className="text-muted-foreground text-xs leading-relaxed">
          Your message will be sent directly to {SUPPORT_EMAIL}.
        </p>
      </form>
    </div>
  );
}

export function SupportLegalLinks() {
  return (
    <div className="mt-7">
      <div className="text-muted-foreground mb-2.5 text-xs font-semibold tracking-[0.14em] uppercase">
        Legal
      </div>
      <div className="flex flex-wrap gap-4.5 text-sm">
        {(["privacy", "terms", "refund"] as const).map((key) => (
          <Link
            key={key}
            to={POLICY_LINKS[key].path}
            className="text-primary font-semibold underline underline-offset-[3px] hover:no-underline"
          >
            {POLICY_LINKS[key].label}
          </Link>
        ))}
      </div>
    </div>
  );
}
