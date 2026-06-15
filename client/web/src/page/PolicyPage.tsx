import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { POLICY_LINKS, type PolicyKey } from "../constants/policies";
import { getActivePolicy, type PolicyDto } from "../services/policy";
import { BLACK as B, WHITE as W } from "../constants/theme";

const LINK_BLUE = "#1a5fff";

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
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    const title = data?.title ?? fallbackTitle;
    document.title = `${title} — FRESHR`;
  }, [data, fallbackTitle]);

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: W,
        fontFamily: "'IBM Plex Mono', monospace",
        color: B,
        padding: "32px 24px 80px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div
          onClick={() => navigate("/")}
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: "1.35rem",
            letterSpacing: "-0.02em",
            color: B,
            cursor: "pointer",
            marginBottom: 32,
            display: "inline-block",
          }}
        >
          ← FRESHR
        </div>

        {loading && !data && (
          <p style={{ fontSize: "0.85rem", color: "#555" }}>Loading…</p>
        )}

        {error && !data && (
          <div
            style={{
              border: `2px solid ${B}`,
              padding: "16px 18px",
              fontSize: "0.82rem",
              lineHeight: 1.6,
            }}
          >
            <p style={{ margin: "0 0 12px" }}>{error}</p>
            <span
              onClick={() => navigate("/")}
              style={{
                fontWeight: 700,
                cursor: "pointer",
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              ← Back to home
            </span>
          </div>
        )}

        {data && (
          <>
            <h1
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: "2.4rem",
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                margin: "0 0 8px",
              }}
            >
              {data.title}
            </h1>
            <p
              style={{
                fontSize: "0.72rem",
                color: "#555",
                letterSpacing: "0.08em",
                marginBottom: 32,
              }}
            >
              VERSION {data.version} · EFFECTIVE {data.effective_date}
            </p>

            <div style={{ fontSize: "0.9rem", lineHeight: 1.75 }}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => (
                    <h2
                      style={{
                        fontFamily: "'Syne', sans-serif",
                        fontWeight: 800,
                        fontSize: "1.5rem",
                        letterSpacing: "-0.02em",
                        margin: "2em 0 0.6em",
                        lineHeight: 1.2,
                      }}
                    >
                      {children}
                    </h2>
                  ),
                  h2: ({ children }) => (
                    <h3
                      style={{
                        fontFamily: "'Syne', sans-serif",
                        fontWeight: 700,
                        fontSize: "1.2rem",
                        margin: "1.6em 0 0.5em",
                        lineHeight: 1.2,
                      }}
                    >
                      {children}
                    </h3>
                  ),
                  h3: ({ children }) => (
                    <h4
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontWeight: 700,
                        fontSize: "0.95rem",
                        letterSpacing: "0.04em",
                        margin: "1.3em 0 0.4em",
                      }}
                    >
                      {children}
                    </h4>
                  ),
                  p: ({ children }) => (
                    <p style={{ margin: "0 0 1em", lineHeight: 1.75 }}>
                      {children}
                    </p>
                  ),
                  strong: ({ children }) => (
                    <strong style={{ fontWeight: 700 }}>{children}</strong>
                  ),
                  ul: ({ children }) => (
                    <ul style={{ margin: "0.6em 0 1em", paddingLeft: "1.4em" }}>
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol style={{ margin: "0.6em 0 1em", paddingLeft: "1.4em" }}>
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li style={{ marginBottom: "0.35em", lineHeight: 1.7 }}>
                      {children}
                    </li>
                  ),
                  a: ({ children, href }) => (
                    <a
                      href={href}
                      style={{
                        color: LINK_BLUE,
                        fontWeight: 700,
                        textDecoration: "underline",
                        textUnderlineOffset: 3,
                      }}
                    >
                      {children}
                    </a>
                  ),
                  table: ({ children }) => (
                    <div
                      style={{
                        overflowX: "auto",
                        margin: "1em 0 1.4em",
                        border: `2px solid ${B}`,
                      }}
                    >
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          fontSize: "0.82rem",
                        }}
                      >
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead style={{ background: B, color: W }}>
                      {children}
                    </thead>
                  ),
                  tbody: ({ children }) => <tbody>{children}</tbody>,
                  tr: ({ children }) => (
                    <tr style={{ borderBottom: `1px solid #ddd` }}>
                      {children}
                    </tr>
                  ),
                  th: ({ children }) => (
                    <th
                      style={{
                        textAlign: "left",
                        padding: "10px 12px",
                        fontWeight: 700,
                        letterSpacing: "0.04em",
                        borderRight: `1px solid #333`,
                      }}
                    >
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td
                      style={{
                        padding: "10px 12px",
                        verticalAlign: "top",
                        borderRight: `1px solid #eee`,
                        lineHeight: 1.6,
                      }}
                    >
                      {children}
                    </td>
                  ),
                  hr: () => (
                    <hr
                      style={{
                        border: "none",
                        borderTop: `2px solid ${B}`,
                        margin: "2em 0",
                      }}
                    />
                  ),
                  blockquote: ({ children }) => (
                    <blockquote
                      style={{
                        borderLeft: `3px solid ${B}`,
                        margin: "1em 0",
                        padding: "0.4em 0 0.4em 1em",
                        color: "#333",
                      }}
                    >
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
