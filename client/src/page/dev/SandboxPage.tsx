import { useState } from "react";

const B = "#000000";
const W = "#FFFFFF";
const G = "#84e487";
const R = "#FF4D4D";

// ─── Layout helpers ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 80 }}>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.18em", color: "#888", textTransform: "uppercase", marginBottom: 6 }}>
        {title}
      </div>
      <div style={{ height: 2, background: B, marginBottom: 28 }} />
      {children}
    </div>
  );
}

function Row({ children, gap = 16 }: { children: React.ReactNode; gap?: number }) {
  return <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", gap }}>{children}</div>;
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", color: "#aaa", textTransform: "uppercase", marginBottom: 10 }}>
      {children}
    </div>
  );
}

function Col({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label>{label}</Label>{children}</div>;
}

// ─── Reusable preview button (used throughout the sandbox) ────────────────────

function Btn({ bg = W, color = B, children, large = false }: { bg?: string; color?: string; children: React.ReactNode; large?: boolean }) {
  const [hovered, setHovered] = useState(false);
  const [down, setDown] = useState(false);
  const isPrimary = bg === B;
  const shadowColor = isPrimary ? G : B;
  const transform = down ? "translate(2px, 2px)" : hovered ? "translate(-3px, -3px)" : "none";
  const shadow = down ? `2px 2px 0 ${shadowColor}` : hovered ? `6px 6px 0 ${shadowColor}` : `4px 4px 0 ${shadowColor}`;
  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setDown(false); }}
      onMouseDown={() => setDown(true)}
      onMouseUp={() => setDown(false)}
      style={{ background: bg, color, border: `2px solid ${B}`, boxShadow: shadow, transform, padding: large ? "16px 36px" : "11px 22px", fontFamily: "'IBM Plex Mono', monospace", fontSize: large ? "0.85rem" : "0.75rem", fontWeight: isPrimary ? 600 : 700, letterSpacing: "0.08em", cursor: "pointer", transition: "transform 0.12s, box-shadow 0.12s" }}
    >
      {children}
    </button>
  );
}

function Input({ label, placeholder, type = "text", error }: { label?: string; placeholder: string; type?: string; error?: string }) {
  const [showPass, setShowPass] = useState(false);
  const [val, setVal] = useState("");
  return (
    <div style={{ width: 280 }}>
      {label && <label style={{ display: "block", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", marginBottom: 6 }}>{label}</label>}
      <div style={{ position: "relative" }}>
        <input
          type={type === "password" ? (showPass ? "text" : "password") : type}
          placeholder={placeholder}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onMouseEnter={(e) => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.borderColor = G; }}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = B)}
          onFocus={(e) => (e.currentTarget.style.borderColor = B)}
          style={{ width: "100%", border: `3px solid ${B}`, borderRadius: 0, padding: type === "password" ? "12px 48px 12px 14px" : "12px 14px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.82rem", background: W, outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" }}
        />
        {type === "password" && (
          <button type="button" onClick={() => setShowPass(v => !v)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#888", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.05em", padding: 0 }}>
            {showPass ? "HIDE" : "SHOW"}
          </button>
        )}
      </div>
      {error && <p style={{ color: "#cc0000", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.72rem", margin: "6px 0 0" }}>{error}</p>}
    </div>
  );
}

function ModalBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: W, border: `2px solid ${B}`, boxShadow: `8px 8px 0 ${B}`, padding: "32px", width: 360 }}>
      {children}
    </div>
  );
}

function ModalTitle({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.2rem", margin: "0 0 8px" }}>{children}</h2>;
}

function ModalBody({ children }: { children: React.ReactNode }) {
  return <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.72rem", color: "#555", margin: "0 0 24px", lineHeight: 1.6 }}>{children}</p>;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SandboxPage() {
  const [chipSelected, setChipSelected] = useState<Record<string, boolean>>({ Photosynthesis: true, "Cell Division": false, "DNA Replication": true, "Newton's Laws": false });
  const [dropdownVal, setDropdownVal] = useState("");
  const [settingsEditing, setSettingsEditing] = useState(false);
  const [settingsVal, setSettingsVal] = useState("Jane");

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f0", padding: "60px 48px", fontFamily: "'IBM Plex Mono', monospace" }}>

      {/* Page header */}
      <div style={{ marginBottom: 64 }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "2.2rem", margin: "0 0 8px" }}>Component Sandbox</h1>
        <p style={{ fontSize: "0.78rem", color: "#555", margin: 0 }}>
          Every UI component in the app — in one place. Give feedback here before anything gets changed.
        </p>
      </div>

      {/* ── 1. BUTTONS ──────────────────────────────────────────────────────── */}
      <Section title="1 — Buttons">
        <p style={{ fontSize: "0.72rem", color: "#555", marginBottom: 28 }}>
          Four variants. Hover to see the lift. Click to see the press.
        </p>
        <Row gap={32}>
          <Col label="Default — cancel, back, secondary">
            <Btn bg={W} color={B}>Cancel</Btn>
          </Col>
          <Col label="Primary — save, confirm, submit">
            <Btn bg={B} color={W}>Save changes</Btn>
          </Col>
          <Col label="Danger — delete, destructive">
            <Btn bg={R} color={B}>Delete notebook</Btn>
          </Col>
          <Col label="Green — log in, sign up, main CTA">
            <Btn bg={G} color={B}>Log in →</Btn>
          </Col>
        </Row>
        <div style={{ height: 36 }} />
        <p style={{ fontSize: "0.72rem", color: "#555", marginBottom: 20 }}>Large variant — landing page and auth pages.</p>
        <Row gap={16}>
          <Btn bg={G} color={B} large>Get started for free</Btn>
          <Btn bg={W} color={B} large>Log in</Btn>
        </Row>
      </Section>

      {/* ── 2. TEXT INPUTS ──────────────────────────────────────────────────── */}
      <Section title="2 — Text inputs">
        <p style={{ fontSize: "0.72rem", color: "#555", marginBottom: 28 }}>
          Hover for green border. Click to focus (stays black). Password has SHOW/HIDE. Third example shows an error state.
        </p>
        <Row gap={28}>
          <Col label="Plain text">
            <Input label="EMAIL" placeholder="you@example.com" />
          </Col>
          <Col label="Password with toggle">
            <Input label="PASSWORD" placeholder="••••••••" type="password" />
          </Col>
          <Col label="With error message below">
            <Input label="EMAIL" placeholder="you@example.com" error="No account found with this email." />
          </Col>
        </Row>
      </Section>

      {/* ── 3. FORM LABEL ───────────────────────────────────────────────────── */}
      <Section title="3 — Form label">
        <p style={{ fontSize: "0.72rem", color: "#555", marginBottom: 28 }}>
          The small uppercase label above every input. Shown alone and paired with an input.
        </p>
        <Row gap={48}>
          <Col label="Standalone">
            <label style={{ display: "block", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em" }}>
              FIRST NAME
            </label>
          </Col>
          <Col label="With input below it">
            <div style={{ width: 260 }}>
              <label style={{ display: "block", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", marginBottom: 6 }}>FIRST NAME</label>
              <input placeholder="Jane" style={{ width: "100%", border: `3px solid ${B}`, borderRadius: 0, padding: "12px 14px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.82rem", background: W, outline: "none", boxSizing: "border-box" }} />
            </div>
          </Col>
        </Row>
      </Section>

      {/* ── 4. ERROR MESSAGE ────────────────────────────────────────────────── */}
      <Section title="4 — Error message">
        <p style={{ fontSize: "0.72rem", color: "#555", marginBottom: 28 }}>
          Two placements: below a single field (field-level), or above the whole form (form-level).
        </p>
        <Row gap={48}>
          <Col label="Below a field">
            <div style={{ width: 280 }}>
              <label style={{ display: "block", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", marginBottom: 6 }}>EMAIL</label>
              <input defaultValue="bademail" style={{ width: "100%", border: `3px solid ${B}`, borderRadius: 0, padding: "12px 14px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.82rem", background: W, outline: "none", boxSizing: "border-box" }} />
              <p style={{ color: "#cc0000", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.72rem", margin: "6px 0 0" }}>Please enter a valid email address.</p>
            </div>
          </Col>
          <Col label="Above the form">
            <div style={{ width: 280 }}>
              <p style={{ color: "#cc0000", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.72rem", margin: "0 0 14px" }}>Incorrect email or password. Please try again.</p>
              <input placeholder="you@example.com" style={{ width: "100%", border: `3px solid ${B}`, borderRadius: 0, padding: "12px 14px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.82rem", background: W, outline: "none", boxSizing: "border-box" }} />
            </div>
          </Col>
        </Row>
      </Section>

      {/* ── 5. TOASTS ───────────────────────────────────────────────────────── */}
      <Section title="5 — Toasts">
        <p style={{ fontSize: "0.72rem", color: "#555", marginBottom: 28 }}>
          Pop up at the bottom of the screen for 3 seconds. Three variants based on the action that triggered them.
          In the real app these stack — shown side by side here for comparison.
        </p>
        <Row gap={16}>
          {[
            { label: "Neutral — rename, archive, restore", bg: W, text: "Notebook renamed" },
            { label: "Success — create", bg: G, text: "Notebook created" },
            { label: "Danger — delete", bg: R, text: "Notebook deleted" },
          ].map(({ label, bg, text }) => (
            <Col key={label} label={label}>
              <div style={{ background: bg, color: B, border: `2px solid ${B}`, boxShadow: `4px 4px 0 ${B}`, padding: "12px 52px", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: "0.82rem", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
                {text}
              </div>
            </Col>
          ))}
        </Row>
      </Section>

      {/* ── 6. NOTEBOOK CARDS ───────────────────────────────────────────────── */}
      <Section title="6 — Notebook cards (grid view)">
        <p style={{ fontSize: "0.72rem", color: "#555", marginBottom: 28 }}>
          Hover to see the green border + lift. The pin icon appears when a notebook is pinned. The ⋮ menu button fades in on hover.
        </p>
        <Row gap={16}>
          {[
            { title: "Organic Chemistry — Semester 1", pinned: true, files: 6, date: "2026-01-14" },
            { title: "Machine Learning Fundamentals", pinned: false, files: 11, date: "2026-01-28" },
            { title: "A very long notebook title that should be clamped to two lines maximum", pinned: false, files: 3, date: "2026-02-03" },
          ].map((nb, i) => {
            const [hov, setHov] = useState(false);
            return (
              <div key={i} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
                style={{ width: 220, height: 140, position: "relative", padding: 16, background: W, border: hov ? `2px solid ${G}` : `2px solid ${B}`, boxShadow: hov ? `6px 6px 0 ${B}` : `3px 3px 0 ${B}`, transform: hov ? "translate(-2px, -2px)" : "none", transition: "transform 0.1s, box-shadow 0.1s, border-color 0.1s", cursor: "pointer", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ width: 16 }}>
                    {nb.pinned && <svg width="12" height="12" viewBox="0 0 12 12" fill={G}><path d="M9 1H3a1 1 0 0 0-1 1v1.5l2 2V10l2 1 2-1V5.5l2-2V2a1 1 0 0 0-1-1Z" /></svg>}
                  </div>
                  <button style={{ background: "none", border: "none", cursor: "pointer", padding: "0 2px", fontSize: "1rem", lineHeight: 1, color: "#888", opacity: hov ? 1 : 0, transition: "opacity 0.1s" }}>⋮</button>
                </div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.95rem", lineHeight: 1.3, flex: 1, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", marginTop: 4 }}>{nb.title}</div>
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.62rem", color: "#888", marginTop: 8 }}>
                  <span>Created {new Date(nb.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                  <span>{nb.files} files</span>
                </div>
              </div>
            );
          })}
        </Row>
      </Section>

      {/* ── 7. NOTEBOOK ROWS ────────────────────────────────────────────────── */}
      <Section title="7 — Notebook rows (list view)">
        <p style={{ fontSize: "0.72rem", color: "#555", marginBottom: 28 }}>
          Same hover behaviour as the card but laid out horizontally.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 700 }}>
          {[
            { title: "Organic Chemistry — Semester 1", pinned: true, files: 6, date: "2026-01-14" },
            { title: "Machine Learning Fundamentals", pinned: false, files: 11, date: "2026-01-28" },
          ].map((nb, i) => {
            const [hov, setHov] = useState(false);
            return (
              <div key={i} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
                style={{ position: "relative", padding: "14px 20px", background: W, border: hov ? `2px solid ${G}` : `2px solid ${B}`, boxShadow: hov ? `6px 6px 0 ${B}` : `3px 3px 0 ${B}`, transform: hov ? "translate(-2px, -2px)" : "none", transition: "transform 0.1s, box-shadow 0.1s, border-color 0.1s", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 14, flexShrink: 0 }}>
                  {nb.pinned && <svg width="12" height="12" viewBox="0 0 12 12" fill={G}><path d="M9 1H3a1 1 0 0 0-1 1v1.5l2 2V10l2 1 2-1V5.5l2-2V2a1 1 0 0 0-1-1Z" /></svg>}
                </div>
                <div style={{ flex: 1, fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.9rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>{nb.title}</div>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.62rem", color: "#888", flexShrink: 0 }}>{nb.files} files</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.62rem", color: "#888", flexShrink: 0 }}>{new Date(nb.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                <button style={{ background: "none", border: "none", cursor: "pointer", padding: "0 2px", fontSize: "1rem", lineHeight: 1, color: "#888", opacity: hov ? 1 : 0, transition: "opacity 0.1s", flexShrink: 0 }}>⋮</button>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── 8. NOTEBOOK CONTEXT MENU ────────────────────────────────────────── */}
      <Section title="8 — Notebook context menu (3-dot)">
        <p style={{ fontSize: "0.72rem", color: "#555", marginBottom: 28 }}>
          Appears when you click ⋮ on a notebook card or row. Hover each row to see the highlight.
        </p>
        <div style={{ background: W, border: `2px solid ${B}`, boxShadow: `4px 4px 0 ${B}`, width: 160, display: "inline-block" }}>
          {[
            { label: "Pin", color: B, weight: 400, danger: false },
            { label: "Rename", color: B, weight: 400, danger: false },
          ].map(({ label, color, weight }) => {
            const [hov, setHov] = useState(false);
            return (
              <div key={label} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
                style={{ padding: "10px 16px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.72rem", color, fontWeight: weight, cursor: "pointer", background: hov ? "#f0f0f0" : "transparent", userSelect: "none" }}>
                {label}
              </div>
            );
          })}
          <div style={{ height: 1, background: "#eee", margin: "2px 0" }} />
          {[
            { label: "Archive", color: B, weight: 400 },
            { label: "Delete", color: "#cc0000", weight: 600 },
          ].map(({ label, color, weight }) => {
            const [hov, setHov] = useState(false);
            return (
              <div key={label} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
                style={{ padding: "10px 16px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.72rem", color, fontWeight: weight, cursor: "pointer", background: hov && color !== "#cc0000" ? "#f0f0f0" : "transparent", userSelect: "none" }}>
                {label}
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── 9. MODALS ───────────────────────────────────────────────────────── */}
      <Section title="9 — Modals (shown inline, no overlay)">
        <p style={{ fontSize: "0.72rem", color: "#555", marginBottom: 28 }}>
          All modals share the same card shell. Three real examples — Delete, Create, and Upgrade.
        </p>
        <Row gap={24}>
          <Col label="Delete notebook">
            <ModalBox>
              <ModalTitle>Delete notebook?</ModalTitle>
              <ModalBody>"Organic Chemistry" will be permanently deleted. This cannot be undone.</ModalBody>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <Btn bg={W} color={B}>Cancel</Btn>
                <Btn bg={R} color={B}>Delete</Btn>
              </div>
            </ModalBox>
          </Col>
          <Col label="Create notebook">
            <ModalBox>
              <ModalTitle>New notebook</ModalTitle>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", marginBottom: 6 }}>TITLE</label>
                <input placeholder="e.g. Biology — Week 3" style={{ width: "100%", border: `3px solid ${B}`, borderRadius: 0, padding: "10px 12px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.82rem", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <Btn bg={W} color={B}>Cancel</Btn>
                <Btn bg={G} color={B}>Create →</Btn>
              </div>
            </ModalBox>
          </Col>
          <Col label="Upgrade to Pro">
            <div style={{ background: W, border: `2px solid ${B}`, boxShadow: `8px 8px 0 ${B}`, padding: "32px", width: 360, display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <ModalTitle>Notebook limit reached</ModalTitle>
                <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.75rem", color: "#555", margin: 0, lineHeight: 1.6 }}>You've used all your notebook slots. Upgrade to Pro to create unlimited notebooks.</p>
              </div>
              <div style={{ border: `2px solid ${B}`, padding: "16px", display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#888" }}>Pro plan includes</span>
                {["Unlimited notebooks", "50 GB storage", "Unlimited daily quizzes", "Priority support"].map(f => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.72rem" }}>
                    <span style={{ width: 14, height: 14, background: G, border: `1.5px solid ${B}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "0.6rem", fontWeight: 700 }}>✓</span>
                    {f}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <Btn bg={W} color={B}>Not now</Btn>
                <Btn bg={G} color={B}>Upgrade to Pro →</Btn>
              </div>
            </div>
          </Col>
        </Row>
      </Section>

      {/* ── 10. USAGE BANNER ────────────────────────────────────────────────── */}
      <Section title="10 — Usage banner">
        <p style={{ fontSize: "0.72rem", color: "#555", marginBottom: 28 }}>
          Appears at the top of the dashboard. Shows how much of the free plan quota has been used.
          Two states: low usage and near-limit.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 700 }}>
          {[
            { plan: "FREE", notebooks: { used: 1, limit: 3 }, storage: { used: 52_428_800, limit: 524_288_000 }, quizzes: { used: 2, limit: 5 } },
            { plan: "FREE", notebooks: { used: 3, limit: 3 }, storage: { used: 498_000_000, limit: 524_288_000 }, quizzes: { used: 5, limit: 5 } },
          ].map((usage, i) => {
            function Bar({ label, used, limit, fmt = (n: number) => String(n) }: { label: string; used: number; limit: number; fmt?: (n: number) => string }) {
              const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 140 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.65rem", color: "#555" }}>
                    <span>{label}</span><span>{fmt(used)} / {fmt(limit)}</span>
                  </div>
                  <div style={{ height: 4, background: "#e8e8e4", border: `1px solid ${B}`, position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${pct}%`, background: B }} />
                  </div>
                </div>
              );
            }
            const fmtBytes = (b: number) => b >= 1_048_576 ? `${(b / 1_048_576).toFixed(0)} MB` : `${(b / 1_024).toFixed(0)} KB`;
            return (
              <div key={i}>
                <Label>{i === 0 ? "Low usage" : "Near limit"}</Label>
                <div style={{ display: "flex", alignItems: "center", gap: 24, padding: "12px 16px", border: `2px solid ${B}`, background: W, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>{usage.plan}</span>
                  <div style={{ width: 1, height: 28, background: B, flexShrink: 0 }} />
                  <Bar label="Notebooks" used={usage.notebooks.used} limit={usage.notebooks.limit} />
                  <Bar label="Storage" used={usage.storage.used} limit={usage.storage.limit} fmt={fmtBytes} />
                  <Bar label="Daily Quizzes" used={usage.quizzes.used} limit={usage.quizzes.limit} />
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── 11. ARCHIVED SECTION ────────────────────────────────────────────── */}
      <Section title="11 — Archived notebooks section">
        <p style={{ fontSize: "0.72rem", color: "#555", marginBottom: 28 }}>
          Appears below the active notebook grid. Greyed out with an Unarchive button on each row.
        </p>
        <div style={{ maxWidth: 700 }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", color: "#aaa", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            ARCHIVED <span style={{ fontWeight: 400 }}>(2)</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {["Spanish B2 Grammar Notes", "History of Architecture"].map((title) => {
              const [hov, setHov] = useState(false);
              return (
                <div key={title} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: W, border: "2px solid #ccc", boxShadow: "2px 2px 0 #ccc" }}>
                  <span style={{ flex: 1, fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.88rem", color: "#888", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>{title}</span>
                  <button onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
                    style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.06em", background: "none", border: `2px solid ${B}`, padding: "4px 10px", cursor: "pointer", flexShrink: 0, color: B, transform: hov ? "translate(-3px,-3px)" : "none", boxShadow: hov ? `3px 3px 0 ${B}` : "none", transition: "transform 0.15s, box-shadow 0.15s" }}>
                    Unarchive
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ── 12. QUIZ CARD ───────────────────────────────────────────────────── */}
      <Section title="12 — Quiz card">
        <p style={{ fontSize: "0.72rem", color: "#555", marginBottom: 28 }}>
          Appears in the Past Quizzes panel on the notebook page. Green left border normally, red when in bulk-delete mode.
        </p>
        <Row gap={24}>
          <Col label="Normal — not selected">
            <div style={{ width: 280, border: `2px solid ${B}` }}>
              {[{ topic: "Photosynthesis, Cell Division", score: "8/10", diff: "medium", q: 10, time: "15min", ago: "2d ago", selected: false, bulk: false }].map((q, i) => (
                <div key={i} style={{ padding: "12px 14px 12px 12px", borderLeft: `4px solid ${G}`, background: W }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                    <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.72rem", fontWeight: 700, margin: 0, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.topic}</p>
                    <div style={{ border: `2px solid ${B}`, padding: "2px 6px", flexShrink: 0 }}><span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.68rem", fontWeight: 700 }}>{q.score}</span></div>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                    {[q.ago, q.diff, q.q + "q", q.time].map((item, j) => (
                      <span key={j} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.58rem", color: j === 0 ? "#999" : "#666", fontWeight: j === 1 ? 700 : 400 }}>{item}{j < 3 ? <span style={{ color: "#ccc", margin: "0 4px" }}>·</span> : ""}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Col>
          <Col label="Selected (reviewing)">
            <div style={{ width: 280, border: `2px solid ${B}` }}>
              <div style={{ padding: "12px 14px 12px 12px", borderLeft: `4px solid ${G}`, background: "#f0fdf0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                  <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.72rem", fontWeight: 700, margin: 0 }}>DNA Replication</p>
                  <div style={{ border: `2px solid ${B}`, padding: "2px 6px" }}><span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.68rem", fontWeight: 700 }}>6/10</span></div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.58rem", color: "#999" }}>1h ago</span>
                  <span style={{ color: "#ccc" }}>·</span>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.58rem", fontWeight: 700, color: "#666" }}>hard</span>
                  <span style={{ color: "#ccc" }}>·</span>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.58rem", color: "#666" }}>10q</span>
                </div>
              </div>
            </div>
          </Col>
          <Col label="Bulk delete mode">
            <div style={{ width: 280, border: `2px solid ${B}` }}>
              <div style={{ padding: "12px 14px 12px 12px", borderLeft: `4px solid ${R}`, background: "#fff0f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                  <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.72rem", fontWeight: 700, margin: 0 }}>Newton's Laws</p>
                  <div style={{ border: `2px solid ${B}`, padding: "2px 6px" }}><span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.68rem", fontWeight: 700 }}>9/10</span></div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.58rem", color: "#999" }}>3d ago</span>
                  <span style={{ color: "#ccc" }}>·</span>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.58rem", fontWeight: 700, color: "#666" }}>easy</span>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                  <input type="checkbox" defaultChecked style={{ cursor: "pointer", accentColor: R, width: 14, height: 14 }} />
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Section>

      {/* ── 13. QUIZ TOPIC CHIPS ────────────────────────────────────────────── */}
      <Section title="13 — Quiz topic chips">
        <p style={{ fontSize: "0.72rem", color: "#555", marginBottom: 28 }}>
          Used on the quiz generator to let users pick which topics to include. Click to toggle.
        </p>
        <Row gap={8}>
          {Object.entries(chipSelected).map(([label, sel]) => {
            const [hov, setHov] = useState(false);
            const bg = sel ? (hov ? "#6dce71" : G) : hov ? "#f0fdf0" : W;
            return (
              <span key={label} onClick={() => setChipSelected(prev => ({ ...prev, [label]: !prev[label] }))} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
                style={{ display: "inline-block", padding: "4px 10px", border: `2px solid ${B}`, background: bg, fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.68rem", fontWeight: sel ? 700 : 500, letterSpacing: "0.04em", cursor: "pointer", userSelect: "none", transition: "background 0.1s" }}>
                {label}
              </span>
            );
          })}
        </Row>
      </Section>

      {/* ── 14. SELECT DROPDOWN ─────────────────────────────────────────────── */}
      <Section title="14 — Select dropdown">
        <p style={{ fontSize: "0.72rem", color: "#555", marginBottom: 28 }}>
          Used on the quiz generator for difficulty, question count, and time limit.
        </p>
        <Row gap={24}>
          {[
            { placeholder: "Difficulty", options: [{ value: "easy", label: "Easy" }, { value: "medium", label: "Medium" }, { value: "hard", label: "Hard" }] },
            { placeholder: "No. of questions", options: [{ value: "5", label: "5 questions" }, { value: "10", label: "10 questions" }, { value: "20", label: "20 questions" }] },
          ].map((dd) => (
            <Col key={dd.placeholder} label={dd.placeholder}>
              <div style={{ position: "relative", width: 200 }}>
                <select value={dropdownVal} onChange={(e) => setDropdownVal(e.target.value)}
                  style={{ width: "100%", appearance: "none", border: `2px solid ${B}`, borderRadius: 0, background: W, fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.72rem", fontWeight: 600, color: dropdownVal ? B : "#999", padding: "9px 32px 9px 12px", cursor: "pointer", outline: "none", boxShadow: `3px 3px 0 ${B}`, boxSizing: "border-box" }}>
                  <option value="" disabled hidden>{dd.placeholder}</option>
                  {dd.options.map(o => <option key={o.value} value={o.value} style={{ color: B }}>{o.label}</option>)}
                </select>
                <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: "0.6rem", color: B }}>▾</span>
              </div>
            </Col>
          ))}
        </Row>
      </Section>

      {/* ── 15. PROFILE AVATAR ──────────────────────────────────────────────── */}
      <Section title="15 — Profile avatar">
        <p style={{ fontSize: "0.72rem", color: "#555", marginBottom: 28 }}>
          Green circle with the user's initial. Used on the profile page and in the sidebar. Three sizes.
        </p>
        <Row gap={32}>
          {[{ size: 40, label: "Small — sidebar" }, { size: 64, label: "Medium" }, { size: 88, label: "Large — profile page" }].map(({ size, label }) => (
            <Col key={label} label={label}>
              <div style={{ width: size, height: size, background: G, border: `3px solid ${B}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: `${Math.round(size * 0.375)}px`, color: B, boxShadow: `4px 4px 0 ${B}`, userSelect: "none" }}>
                J
              </div>
            </Col>
          ))}
        </Row>
      </Section>

      {/* ── 16. SETTINGS FIELD ──────────────────────────────────────────────── */}
      <Section title="16 — Settings field">
        <p style={{ fontSize: "0.72rem", color: "#555", marginBottom: 28 }}>
          Used on the profile page for each editable field. Click Edit below to see the edit state.
        </p>
        <div style={{ maxWidth: 480, background: W, border: `2px solid ${B}`, padding: 24 }}>
          <div style={{ borderBottom: `2px solid ${B}`, paddingBottom: 20, marginBottom: 20 }}>
            <label style={{ display: "block", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.14em", color: "#555", marginBottom: 8 }}>FIRST NAME</label>
            {settingsEditing ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input autoFocus value={settingsVal} onChange={(e) => setSettingsVal(e.target.value)}
                  style={{ flex: 1, border: `3px solid ${B}`, borderRadius: 0, padding: "10px 12px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.88rem", background: W, outline: "none", boxSizing: "border-box" }} />
                <button onClick={() => setSettingsEditing(false)}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translate(-3px,-3px)"; e.currentTarget.style.boxShadow = `6px 6px 0 ${B}`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = `3px 3px 0 ${B}`; }}
                  style={{ background: G, color: B, border: `2px solid ${B}`, boxShadow: `3px 3px 0 ${B}`, padding: "10px 16px", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: "0.7rem", letterSpacing: "0.06em", cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s" }}>Save</button>
                <button onClick={() => setSettingsEditing(false)}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translate(-3px,-3px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; }}
                  style={{ background: W, color: B, border: `2px solid ${B}`, padding: "10px 16px", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: "0.7rem", letterSpacing: "0.06em", cursor: "pointer", transition: "transform 0.15s" }}>Cancel</button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.88rem" }}>{settingsVal}</span>
                <button onClick={() => setSettingsEditing(true)}
                  onMouseEnter={(e) => (e.currentTarget.style.color = B)} onMouseLeave={(e) => (e.currentTarget.style.color = "#888")}
                  style={{ background: "none", border: "none", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", color: "#888", cursor: "pointer", padding: "4px 0", textDecoration: "underline", textUnderlineOffset: 3, transition: "color 0.12s" }}>Edit</button>
              </div>
            )}
          </div>
          <div>
            <label style={{ display: "block", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.14em", color: "#aaa", marginBottom: 8 }}>EMAIL</label>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.88rem", color: "#aaa" }}>jane@example.com</span>
            </div>
            <p style={{ fontSize: "0.63rem", color: "#aaa", marginTop: 6, fontFamily: "'IBM Plex Mono', monospace" }}>Email cannot be changed</p>
          </div>
        </div>
      </Section>

      {/* ── 17. LOADING SPINNER ─────────────────────────────────────────────── */}
      <Section title="17 — Loading spinner">
        <p style={{ fontSize: "0.72rem", color: "#555", marginBottom: 28 }}>
          Full-screen white overlay with a spinning circle. Shown here at a smaller scale.
        </p>
        <div style={{ width: 200, height: 140, background: W, border: `2px solid ${B}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, border: "4px solid #e5e5e5", borderTopColor: "#1a1a1a", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <span style={{ fontSize: "0.72rem", color: "#888", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.04em" }}>Loading...</span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </Section>

      {/* ── 18. SIDEBAR ─────────────────────────────────────────────────────── */}
      <Section title="18 — Sidebar">
        <p style={{ fontSize: "0.72rem", color: "#555", marginBottom: 28 }}>
          The black left rail on the dashboard. Has expanded and collapsed states. Click the arrow to toggle.
        </p>
        <Row gap={24}>
          <Col label="Expanded">
            <div style={{ width: 240, height: 320, background: B, color: W, display: "flex", flexDirection: "column", border: `2px solid ${B}` }}>
              <div style={{ padding: "20px 16px", borderBottom: "1px solid #222", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.25rem", letterSpacing: "-0.02em", color: G }}>FRESHR</div>
                <button style={{ background: "none", border: "1px solid #333", cursor: "pointer", padding: "4px 5px", lineHeight: 1 }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7.5 2L4 6l3.5 4" stroke="#666" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </div>
              <div style={{ flex: 1, padding: "16px" }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", color: "#555", marginBottom: 12 }}>NOTEBOOKS</div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.68rem", color: "#444" }}>Open a notebook to see it here</div>
              </div>
              <div style={{ borderTop: "1px solid #222" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", cursor: "pointer" }}>
                  <div style={{ width: 28, height: 28, background: G, color: B, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "0.7rem", flexShrink: 0 }}>J</div>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.68rem", color: "#888" }}>jane@example.com</span>
                </div>
              </div>
            </div>
          </Col>
          <Col label="Collapsed">
            <div style={{ width: 60, height: 320, background: B, color: W, display: "flex", flexDirection: "column", border: `2px solid ${B}` }}>
              <div style={{ padding: "20px 0", borderBottom: "1px solid #222", display: "flex", justifyContent: "center" }}>
                <button style={{ background: "none", border: "1px solid #333", cursor: "pointer", padding: "4px 5px", lineHeight: 1 }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: "rotate(180deg)" }}><path d="M7.5 2L4 6l3.5 4" stroke="#666" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </div>
              <div style={{ flex: 1, padding: "16px 0", display: "flex", justifyContent: "center" }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M2 5a2 2 0 0 1 2-2h3.586a1 1 0 0 1 .707.293L9.707 4.707A1 1 0 0 0 10.414 5H16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5Z" stroke="#444" strokeWidth="1.5" fill="none" /></svg>
              </div>
              <div style={{ borderTop: "1px solid #222", display: "flex", justifyContent: "center", padding: "14px 0" }}>
                <div style={{ width: 28, height: 28, background: G, color: B, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "0.7rem" }}>J</div>
              </div>
            </div>
          </Col>
        </Row>
      </Section>

      {/* ── 19. "OR" DIVIDER ────────────────────────────────────────────────── */}
      <Section title='19 — "Or" divider'>
        <p style={{ fontSize: "0.72rem", color: "#555", marginBottom: 28 }}>
          Sits between the Google button and the email/password form on Login and Signup. Shown in context.
        </p>
        <div style={{ background: W, border: `2px solid ${B}`, padding: "28px 32px", maxWidth: 400 }}>
          <button style={{ width: "100%", padding: 11, border: `2px solid ${B}`, background: W, fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", marginBottom: 20 }}>Continue with Google</button>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 2, background: B }} />
            <span style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", color: "#666" }}>or</span>
            <div style={{ flex: 1, height: 2, background: B }} />
          </div>
          <input placeholder="you@example.com" style={{ width: "100%", border: `3px solid ${B}`, borderRadius: 0, padding: "12px 14px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.82rem", background: W, outline: "none", boxSizing: "border-box" }} />
        </div>
      </Section>

      {/* ── 20. ACCENT DIVIDER ──────────────────────────────────────────────── */}
      <Section title="20 — Accent divider">
        <p style={{ fontSize: "0.72rem", color: "#555", marginBottom: 28 }}>
          Thick black bar used as a separator on standalone pages (Not Found, Payment Success, Payment Cancel).
        </p>
        <div style={{ background: W, border: `2px solid ${B}`, padding: "40px 32px", maxWidth: 420, textAlign: "center" }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.4rem", margin: "0 0 16px" }}>Payment successful</h2>
          <div style={{ height: 3, background: B, margin: "0 0 16px" }} />
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.72rem", color: "#555", margin: "0 0 24px", lineHeight: 1.6 }}>Your plan has been upgraded. You can now create unlimited notebooks.</p>
          <Btn bg={G} color={B}>Go to dashboard →</Btn>
        </div>
      </Section>

    </div>
  );
}
