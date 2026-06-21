import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { POLICY_LINKS, type PolicyKey } from "../constants/policies";
import { getActivePolicy, type PolicyDto } from "../services/policy";

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
  const navigate = useNavigate();
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
    return () => { cancelled = true; };
  }, [slug]);

  useEffect(() => {
    const title = data?.title ?? fallbackTitle;
    document.title = `${title} — FRESHR`;
  }, [data, fallbackTitle]);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <button
          onClick={() => navigate("/")}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 block"
        >
          ← FRESHR
        </button>

        {loading && !data && (
          <p className="text-sm text-muted-foreground">Loading…</p>
        )}

        {error && !data && (
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground mb-3">{error}</p>
            <button
              onClick={() => navigate("/")}
              className="text-sm font-medium text-foreground hover:underline underline-offset-4"
            >
              ← Back to home
            </button>
          </div>
        )}

        {data && (
          <>
            <h1 className="text-3xl font-bold text-foreground tracking-tight leading-tight mb-2">
              {data.title}
            </h1>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-8">
              Version {data.version} · Effective {data.effective_date}
            </p>

            <div className="text-sm leading-relaxed text-foreground">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => (
                    <h2 className="text-xl font-semibold text-foreground mt-8 mb-3 leading-snug">{children}</h2>
                  ),
                  h2: ({ children }) => (
                    <h3 className="text-base font-semibold text-foreground mt-6 mb-2 leading-snug">{children}</h3>
                  ),
                  h3: ({ children }) => (
                    <h4 className="text-sm font-semibold text-foreground mt-5 mb-1.5">{children}</h4>
                  ),
                  p: ({ children }) => (
                    <p className="mb-4 text-muted-foreground leading-relaxed">{children}</p>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-foreground">{children}</strong>
                  ),
                  ul: ({ children }) => (
                    <ul className="my-3 pl-5 list-disc text-muted-foreground">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="my-3 pl-5 list-decimal text-muted-foreground">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="mb-1.5 leading-relaxed">{children}</li>
                  ),
                  a: ({ children, href }) => (
                    <a href={href} className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors">
                      {children}
                    </a>
                  ),
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-4 rounded-lg border border-border">
                      <table className="w-full border-collapse text-sm">{children}</table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-secondary text-foreground">{children}</thead>
                  ),
                  tbody: ({ children }) => <tbody>{children}</tbody>,
                  tr: ({ children }) => (
                    <tr className="border-b border-border">{children}</tr>
                  ),
                  th: ({ children }) => (
                    <th className="text-left px-4 py-2.5 font-medium text-xs uppercase tracking-wider border-r border-border last:border-r-0">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="px-4 py-2.5 text-muted-foreground border-r border-border last:border-r-0 leading-relaxed">
                      {children}
                    </td>
                  ),
                  hr: () => <hr className="border-border my-8" />,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-border pl-4 my-4 text-muted-foreground italic">
                      {children}
                    </blockquote>
                  ),
                }}
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
