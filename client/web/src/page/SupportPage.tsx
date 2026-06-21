import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { sendSupportEmail } from "../lib/supportEmail";

const SUPPORT_EMAIL = "team@freshr.cc";
const BUSINESS_ADDRESS_LINES = ["Ground floor, Setara's Dream, 1/11 Pallabi Mirpur"];
const BUSINESS_PHONE = "+8801813884557 +8801873070777";
const BUSINESS_HOURS = "Sun–Thu, 10:00–18:00 (GMT+6)";

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
    <div className={`rounded-lg border border-border p-5 ${accent ? "bg-primary/10" : "bg-card"}`}>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{label}</p>
      {children}
    </div>
  );
}

export default function SupportPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
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
      setError(err instanceof Error ? err.message : "Could not send your message. Please try again.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col">
      {/* Nav */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-16 h-14 border-b border-border bg-background/80 backdrop-blur-sm shrink-0">
        <button
          onClick={() => navigate("/")}
          className="text-base font-bold text-foreground tracking-tight"
        >
          FRESHR
        </button>
        <Button variant="default" onClick={() => navigate("/")}>← Home</Button>
      </nav>

      {/* Content */}
      <div className="px-6 md:px-16 py-16 flex-1">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-10">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider border border-border rounded-full px-3 py-1 mb-4">
              ◆ Support
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight leading-tight mb-4">
              How can we{" "}
              <span className="text-primary">help?</span>
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
              Drop us a message and our team will get back to you. You can also reach us directly using the details on the right.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            {/* Form */}
            <div className="rounded-lg border border-border bg-card p-8">
              <h2 className="text-lg font-semibold text-foreground mb-6">Send us a message</h2>

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
                  <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell us how we can help..." rows={6} />
                </div>
                <Button variant="green" fullWidth type="submit" disabled={isSending}>
                  {isSending ? "Sending..." : "Send message →"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Your message will be sent directly to {SUPPORT_EMAIL}.
                </p>
              </form>
            </div>

            {/* Contact info */}
            <div className="flex flex-col gap-4">
              <ContactCard label="Email" accent>
                <p className="text-lg font-semibold text-foreground break-all">{SUPPORT_EMAIL}</p>
              </ContactCard>
              <ContactCard label="Phone">
                <p className="text-base font-semibold text-foreground">{BUSINESS_PHONE}</p>
              </ContactCard>
              <ContactCard label="Business hours">
                <p className="text-sm text-foreground leading-relaxed">{BUSINESS_HOURS}</p>
              </ContactCard>
              <ContactCard label="Address">
                <address className="not-italic text-sm text-foreground leading-relaxed">
                  {BUSINESS_ADDRESS_LINES.map((line, i) => <div key={i}>{line}</div>)}
                </address>
              </ContactCard>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-6 md:px-16 py-6 flex flex-wrap items-center justify-between gap-4 border-t border-border">
        <span className="text-base font-bold text-foreground">FRESHR</span>
        <span className="text-xs text-muted-foreground">© 2026 FRESHR</span>
      </footer>
    </div>
  );
}
