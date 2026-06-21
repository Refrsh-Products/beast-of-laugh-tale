import { useState } from "react";
import { Link } from "react-router-dom";
import type { ProfileTab } from "./ProfileSidebar";
import Button from "../ui/Button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Separator } from "../ui/separator";
import { sendSupportEmail } from "../../lib/supportEmail";
import { POLICY_LINKS } from "../../constants/policies";

const SUPPORT_EMAIL = "team@freshr.cc";
const BUSINESS_ADDRESS_LINES = ["Ground floor, Setara's Dream, 1/11 Pallabi Mirpur"];
const BUSINESS_PHONE = "+8801813884557 +8801873070777";
const BUSINESS_HOURS = "Sun–Thu, 10:00–18:00 (GMT+6)";

interface SupportContentAreaProps {
  activeTab: ProfileTab;
  defaultName?: string;
  defaultEmail?: string;
}

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
    <div className={`rounded-lg border border-border p-4 ${accent ? "bg-primary/10" : "bg-card"}`}>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{label}</p>
      {children}
    </div>
  );
}

export default function SupportContentArea({
  activeTab,
  defaultName = "",
  defaultEmail = "",
}: SupportContentAreaProps) {
  const [fullName, setFullName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [mobile, setMobile] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (activeTab !== "support") return null;

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
      setError(err instanceof Error ? err.message : "Could not send your message. Please try again.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-1">Support</h2>
      <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
        Send us a message and our team will get back to you.
      </p>

      {/* Contact cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <ContactCard label="Email" accent>
          <p className="text-sm font-medium text-foreground break-all">{SUPPORT_EMAIL}</p>
        </ContactCard>
        <ContactCard label="Phone">
          <p className="text-sm font-medium text-foreground">{BUSINESS_PHONE}</p>
        </ContactCard>
        <ContactCard label="Business hours">
          <p className="text-sm text-foreground">{BUSINESS_HOURS}</p>
        </ContactCard>
        <ContactCard label="Address">
          <address className="not-italic text-sm text-foreground leading-relaxed">
            {BUSINESS_ADDRESS_LINES.map((line, i) => <div key={i}>{line}</div>)}
          </address>
        </ContactCard>
      </div>

      {/* Form */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-base font-semibold text-foreground mb-5">Send us a message</h3>

        {error && <p className="text-sm text-destructive mb-4">{error}</p>}

        {sent && (
          <div className="rounded-md border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary font-medium mb-4">
            Message sent. We'll get back to you soon.
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mobile">Mobile number</Label>
            <Input id="mobile" type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="+880 1XXX-XXXXXX" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell us how we can help..." rows={5} />
          </div>
          <Button variant="green" fullWidth type="submit" disabled={isSending}>
            {isSending ? "Sending..." : "Send message →"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Your message will be sent directly to {SUPPORT_EMAIL}.
          </p>
        </form>
      </div>

      {/* Legal */}
      <div className="mt-6">
        <Separator className="mb-4" />
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Legal</p>
        <div className="flex flex-wrap gap-4">
          {(["privacy", "terms", "refund"] as const).map((key) => (
            <Link
              key={key}
              to={POLICY_LINKS[key].path}
              className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
            >
              {POLICY_LINKS[key].label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
