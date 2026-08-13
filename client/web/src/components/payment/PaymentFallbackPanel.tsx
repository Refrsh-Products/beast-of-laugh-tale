import { useState } from "react";
import type { PaymentAssistanceRequest } from "@freshr/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RiCheckLine, RiWhatsappLine } from "@remixicon/react";

interface PaymentFallbackPanelProps {
  headline: string;
  message: string;
  /** Bare `https://wa.me/<digits>`, or empty when sales hasn't set a number. */
  whatsappUrl: string;
  /**
   * Human-readable plan name, used in the summary and the WhatsApp prefill.
   * `null` until the user picks a plan, which keeps the apology visible without
   * guessing which plan they wanted.
   */
  planLabel: string | null;
  defaultPhone: string;
  referralCode: string;
  onSubmit: (phone: string) => Promise<PaymentAssistanceRequest>;
}

/**
 * Shown in place of checkout while the payment gateway is down.
 *
 * Collects a contact number and hands the user a reference code plus a direct
 * WhatsApp link to sales, who grant paid access manually from the Django admin.
 */
export default function PaymentFallbackPanel({
  headline,
  message,
  whatsappUrl,
  planLabel,
  defaultPhone,
  referralCode,
  onSubmit,
}: PaymentFallbackPanelProps) {
  const [phone, setPhone] = useState(defaultPhone);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PaymentAssistanceRequest | null>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      setResult(await onSubmit(phone.trim()));
    } catch {
      setError("Couldn't send your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const buildWhatsappHref = (referenceCode: string) => {
    const base = result?.whatsapp_url || whatsappUrl;
    if (!base) return "";
    const text = `Hi, I'd like paid access — ref ${referenceCode}, ${planLabel} plan.`;
    return `${base}?text=${encodeURIComponent(text)}`;
  };

  if (result) {
    const whatsappHref = buildWhatsappHref(result.reference_code);

    return (
      <div className="border-border bg-card mb-6 rounded-3xl border p-6">
        <div className="text-success mb-2 flex items-center gap-1.5 text-sm font-semibold">
          <RiCheckLine className="size-4" aria-hidden="true" />
          Request received
        </div>

        <h3 className="font-heading text-foreground mb-2 text-xl leading-tight font-bold">
          We'll be in touch shortly
        </h3>

        <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
          Your reference is{" "}
          <span className="text-foreground font-semibold tracking-[0.06em]">
            {result.reference_code}
          </span>
          . Quote it when you talk to us and we'll pull up your account straight
          away.
        </p>

        {whatsappHref && (
          <Button asChild className="w-full sm:w-auto">
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
              <RiWhatsappLine aria-hidden="true" />
              Message us on WhatsApp
            </a>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="border-border bg-card mb-6 rounded-3xl border p-6">
      <h3 className="font-heading text-foreground mb-2 text-xl leading-tight font-bold">
        {headline}
      </h3>

      <p className="text-muted-foreground text-sm leading-relaxed">{message}</p>

      {planLabel === null ? (
        <p className="text-foreground mt-4 text-sm font-semibold">
          Pick a plan below and we'll take it from there.
        </p>
      ) : (
        <>
          <div className="border-border bg-muted/40 my-5 rounded-2xl border px-4 py-3">
            <div className="text-muted-foreground text-xs font-semibold tracking-[0.14em] uppercase">
              Requesting
            </div>
            <div className="text-foreground text-sm font-semibold">
              {planLabel} plan
              {referralCode ? ` · code ${referralCode}` : ""}
            </div>
          </div>

          <label
            htmlFor="assistance-phone-input"
            className="text-foreground mb-2.5 block text-sm font-semibold"
          >
            Contact number{" "}
            <span className="text-muted-foreground font-normal">
              (optional)
            </span>
          </label>

          <div className="flex flex-col items-stretch gap-2 sm:flex-row">
            <Input
              id="assistance-phone-input"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !submitting) handleSubmit();
              }}
              placeholder="e.g. 01712345678"
              disabled={submitting}
            />
            <Button
              id="request-assistance-btn"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Sending…" : "Send request"}
            </Button>
          </div>

          <p className="text-muted-foreground mt-2.5 text-xs">
            We'll use the number on your account if you leave this blank.
          </p>
        </>
      )}

      {error && (
        <div
          role="alert"
          className="border-destructive bg-destructive/10 text-destructive mt-4 rounded-2xl border px-4 py-3 text-sm font-semibold"
        >
          {error}
        </div>
      )}
    </div>
  );
}
