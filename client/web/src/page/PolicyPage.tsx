import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { POLICY_LINKS, type PolicyKey } from "../constants/policies";
import { getActivePolicy, type PolicyDto } from "../services/policy";
import { DOCUMENT_MARKDOWN } from "../components/common/documentMarkdown";
import { Button } from "@/components/ui/button";
import { RiArrowLeftLine } from "@remixicon/react";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface CachedPolicy extends PolicyDto {
  fetchedAt: number;
}

function cacheKey(slug: string) {
  return `policy:${slug}`;
}

function readCache(slug: string): CachedPolicy | null {
  try {
    const raw = localStorage.getItem(cacheKey(slug));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedPolicy;
    if (Date.now() - parsed.fetchedAt > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(policy: PolicyDto) {
  try {
    const payload: CachedPolicy = { ...policy, fetchedAt: Date.now() };
    localStorage.setItem(cacheKey(policy.slug), JSON.stringify(payload));
  } catch {
    // localStorage may be unavailable (private mode, quota); fail silently.
  }
}

interface PolicyPageProps {
  policy: PolicyKey;
}

export default function PolicyPage({ policy }: PolicyPageProps) {
  const slug = POLICY_LINKS[policy].slug;
  const fallbackTitle = POLICY_LINKS[policy].label;

  const [data, setData] = useState<PolicyDto | null>(() => readCache(slug));
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getActivePolicy(slug)
      .then((fresh) => {
        if (cancelled) return;
        setData(fresh);
        writeCache(fresh);
        setError(null);
      })
      .catch(() => {
        if (cancelled) return;
        if (!data) setError("Could not load this policy. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    const title = data?.title ?? fallbackTitle;
    document.title = `${title} — FRESHR`;
  }, [data, fallbackTitle]);

  return (
    <div className="bg-background text-foreground min-h-dvh px-6 pt-8 pb-20">
      <div className="mx-auto max-w-180">
        <Button variant="ghost" size="sm" asChild className="mb-8">
          <Link to="/">
            <RiArrowLeftLine aria-hidden="true" />
            Back to FRESHR
          </Link>
        </Button>

        {loading && !data && (
          <p className="text-muted-foreground text-sm">Loading…</p>
        )}

        {error && !data && (
          <div className="border-border rounded-2xl border p-5 text-sm leading-relaxed">
            <p className="mb-3">{error}</p>
            <Link
              to="/"
              className="text-primary font-semibold underline underline-offset-[3px]"
            >
              ← Back to home
            </Link>
          </div>
        )}

        {data && (
          <>
            <h1 className="font-heading text-foreground mb-2 text-4xl leading-tight font-bold tracking-tight">
              {data.title}
            </h1>
            <p className="text-muted-foreground mb-8 text-xs tracking-[0.08em] uppercase">
              Version {data.version} · Effective {data.effective_date}
            </p>

            <div className="text-foreground text-[0.9rem] leading-[1.75]">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={DOCUMENT_MARKDOWN}
              >
                {data.body}
              </ReactMarkdown>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
