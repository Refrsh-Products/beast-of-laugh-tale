import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import useAuthService from "../services/auth";
import useAccountService from "../services/account";
import type { StoredAccount } from "../storage";
import SettingsField from "../components/settings/SettingsField";
import ProfileSidebar, {
  type ProfileTab,
} from "../components/profile/ProfileSidebar";

const G = "#84e487";
const B = "#000000";
const W = "#FFFFFF";

type EditableField = "name" | "phone" | "address" | "city" | "postal_code";

function formatMemberSince(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function ReadOnlyRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ borderBottom: `2px solid ${B}`, paddingBottom: 20 }}>
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "0.65rem",
          fontWeight: 700,
          letterSpacing: "0.14em",
          color: "#aaa",
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "0.88rem",
          color: "#888",
        }}
      >
        {value || "—"}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const authService = useAuthService();
  const accountService = useAccountService();
  const navigate = useNavigate();
  const user = authService.getUser();
  const account = accountService.getAccount();

  const [name, setName] = useState(
    account ? `${account.first_name} ${account.last_name}`.trim() : "",
  );
  const [phone, setPhone] = useState(account?.phone ?? "");
  const [address, setAddress] = useState(account?.address1 ?? "");
  const [address2, setAddress2] = useState(account?.address2 ?? "");
  const [city, setCity] = useState(account?.city ?? "");
  const [postalCode, setPostalCode] = useState(account?.postal_code ?? "");
  const [activeTab, setActiveTab] = useState<ProfileTab>("profile");

  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editAddress2, setEditAddress2] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(null), 3000);
    return () => clearTimeout(timer);
  }, [success]);

  if (!authService.isLoggedIn()) return <Navigate to="/login" replace />;

  const avatarLetter = (name || user?.email || "?")[0].toUpperCase();
  // Use the URL if it exists and isn't an empty string, otherwise fallback to the letter
  const avatar =
    account?.profile_picture_url && account.profile_picture_url.trim() !== ""
      ? account.profile_picture_url
      : avatarLetter;
  const planLabel = account?.tier_plan ?? "FREE";

  function startEdit(field: EditableField) {
    setEditingField(field);
    if (field === "name") {
      setEditFirstName(account?.first_name ?? "");
      setEditLastName(account?.last_name ?? "");
    } else if (field === "address") {
      setEditValue(address);
      setEditAddress2(address2);
    } else {
      const valueMap: Record<string, string> = {
        phone,
        city,
        postal_code: postalCode,
      };
      setEditValue(valueMap[field] ?? "");
    }
    setSuccess(null);
  }

  function cancelEdit() {
    setEditingField(null);
    setEditValue("");
    setEditFirstName("");
    setEditLastName("");
    setEditAddress2("");
    setNameError(null);
  }

  async function saveEdit() {
    if (!editingField || !account) return;

    let updated: StoredAccount;

    if (editingField === "name") {
      const fn = editFirstName.trim();
      const ln = editLastName.trim();
      if (!fn || !ln) {
        setNameError(
          !fn ? "First name is required." : "Last name is required.",
        );
        return;
      }
      setNameError(null);
      updated = { ...account, first_name: fn, last_name: ln };
      setName(`${fn} ${ln}`.trim());
    } else if (editingField === "address") {
      const a1 = editValue.trim();
      if (!a1) return;
      const a2 = editAddress2.trim();
      updated = { ...account, address1: a1, address2: a2 };
      setAddress(a1);
      setAddress2(a2);
    } else {
      const trimmed = editValue.trim();
      if (!trimmed) return;
      updated = {
        ...account,
        phone: editingField === "phone" ? trimmed : account.phone,
        city: editingField === "city" ? trimmed : account.city,
        postal_code:
          editingField === "postal_code" ? trimmed : account.postal_code,
      };
      if (editingField === "phone") setPhone(trimmed);
      if (editingField === "city") setCity(trimmed);
      if (editingField === "postal_code") setPostalCode(trimmed);
    }

    setEditingField(null);
    setEditValue("");
    setEditFirstName("");
    setEditLastName("");
    setEditAddress2("");

    try {
      await accountService.updateAccount(updated);
      setSuccess(
        `${editingField.charAt(0).toUpperCase() + editingField.slice(1)} updated.`,
      );
    } catch {
      setSuccess("Failed to save. Please try again.");
    }
  }

  function handleLogout() {
    authService.logout();
    navigate("/login");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#f5f5f0",
        fontFamily: "'IBM Plex Mono', monospace",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          background: W,
          borderBottom: `3px solid ${B}`,
          padding: "16px 32px",
          flexShrink: 0,
        }}
      >
        <span
          onClick={() => navigate("/dashboard")}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
          style={{
            fontSize: "0.78rem",
            fontWeight: 700,
            color: B,
            cursor: "pointer",
            letterSpacing: "0.04em",
            textDecoration: "none",
            textUnderlineOffset: "3px",
          }}
        >
          ← Back to dashboard
        </span>
      </div>

      {/* Two-panel layout */}
      <div style={{ display: "flex", flex: 1 }}>
        <ProfileSidebar
          avatar={avatar}
          name={name}
          email={user?.email ?? ""}
          plan={planLabel}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Content area */}
        <div
          style={{
            flex: 1,
            padding: "48px",
            overflowY: "auto",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div style={{ width: "100%", maxWidth: 420 }}>
            {/* ── Profile tab ── */}
            {activeTab === "profile" && (
              <>
                <h2
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 800,
                    fontSize: "1.5rem",
                    letterSpacing: "-0.02em",
                    marginBottom: 32,
                    lineHeight: 1.1,
                  }}
                >
                  Profile
                </h2>

                {success && (
                  <div
                    style={{
                      background: G,
                      border: `2px solid ${B}`,
                      padding: "12px 16px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      marginBottom: 24,
                    }}
                  >
                    {success}
                  </div>
                )}

                <div
                  style={{ display: "flex", flexDirection: "column", gap: 0 }}
                >
                  {editingField === "name" ? (
                    <div
                      style={{
                        borderBottom: `2px solid ${B}`,
                        paddingBottom: 20,
                      }}
                    >
                      <label
                        style={{
                          display: "block",
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          letterSpacing: "0.14em",
                          color: "#555",
                          marginBottom: 8,
                        }}
                      >
                        NAME
                      </label>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        <input
                          autoFocus
                          required
                          placeholder="First name"
                          value={editFirstName}
                          onChange={(e) => setEditFirstName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit();
                            if (e.key === "Escape") cancelEdit();
                          }}
                          onMouseEnter={(e) => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.borderColor = G; }}
                          onMouseLeave={(e) => (e.currentTarget.style.borderColor = B)}
                          onFocus={(e) => (e.currentTarget.style.borderColor = B)}
                          style={{
                            border: `3px solid ${B}`,
                            borderRadius: 0,
                            padding: "10px 12px",
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: "0.88rem",
                            background: W,
                            outline: "none",
                            boxSizing: "border-box",
                            transition: "border-color 0.15s",
                          }}
                        />
                        <input
                          required
                          placeholder="Last name"
                          value={editLastName}
                          onChange={(e) => setEditLastName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit();
                            if (e.key === "Escape") cancelEdit();
                          }}
                          onMouseEnter={(e) => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.borderColor = G; }}
                          onMouseLeave={(e) => (e.currentTarget.style.borderColor = B)}
                          onFocus={(e) => (e.currentTarget.style.borderColor = B)}
                          style={{
                            border: `3px solid ${B}`,
                            borderRadius: 0,
                            padding: "10px 12px",
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: "0.88rem",
                            background: W,
                            outline: "none",
                            boxSizing: "border-box",
                            transition: "border-color 0.15s",
                          }}
                        />
                        {nameError && (
                          <p
                            style={{
                              fontFamily: "'IBM Plex Mono', monospace",
                              fontSize: "0.7rem",
                              color: "#cc0000",
                              margin: 0,
                            }}
                          >
                            {nameError}
                          </p>
                        )}
                        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                          <button
                            onClick={saveEdit}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = "translate(-3px, -3px)"; e.currentTarget.style.boxShadow = `6px 6px 0 ${B}`; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = `3px 3px 0 ${B}`; }}
                            style={{
                              background: G,
                              color: B,
                              border: `2px solid ${B}`,
                              boxShadow: `3px 3px 0 ${B}`,
                              padding: "10px 16px",
                              fontFamily: "'IBM Plex Mono', monospace",
                              fontWeight: 700,
                              fontSize: "0.7rem",
                              letterSpacing: "0.06em",
                              cursor: "pointer",
                              lineHeight: 1,
                              transition: "transform 0.15s, box-shadow 0.15s",
                            }}
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = "translate(-3px, -3px)"; e.currentTarget.style.boxShadow = `3px 3px 0 ${B}`; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
                            style={{
                              background: W,
                              color: B,
                              border: `2px solid ${B}`,
                              padding: "10px 16px",
                              fontFamily: "'IBM Plex Mono', monospace",
                              fontWeight: 700,
                              fontSize: "0.7rem",
                              letterSpacing: "0.06em",
                              cursor: "pointer",
                              lineHeight: 1,
                              transition: "transform 0.15s, box-shadow 0.15s",
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <SettingsField
                      label="NAME"
                      value={name}
                      onEditStart={() => startEdit("name")}
                      onSave={saveEdit}
                      onCancel={cancelEdit}
                    />
                  )}
                  <SettingsField
                    label="PHONE"
                    value={editingField === "phone" ? editValue : phone}
                    isEditing={editingField === "phone"}
                    onChange={setEditValue}
                    onEditStart={() => startEdit("phone")}
                    onSave={saveEdit}
                    onCancel={cancelEdit}
                  />
                  {editingField === "address" ? (
                    <div style={{ borderBottom: `2px solid ${B}`, paddingBottom: 20 }}>
                      <label
                        style={{
                          display: "block",
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          letterSpacing: "0.14em",
                          color: "#555",
                          marginBottom: 8,
                        }}
                      >
                        ADDRESS
                      </label>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <input
                          autoFocus
                          required
                          placeholder="Address line 1"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit();
                            if (e.key === "Escape") cancelEdit();
                          }}
                          onMouseEnter={(e) => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.borderColor = G; }}
                          onMouseLeave={(e) => (e.currentTarget.style.borderColor = B)}
                          onFocus={(e) => (e.currentTarget.style.borderColor = B)}
                          style={{
                            border: `3px solid ${B}`,
                            borderRadius: 0,
                            padding: "10px 12px",
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: "0.88rem",
                            background: W,
                            outline: "none",
                            boxSizing: "border-box",
                            transition: "border-color 0.15s",
                          }}
                        />
                        <input
                          placeholder="Address line 2 (optional)"
                          value={editAddress2}
                          onChange={(e) => setEditAddress2(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit();
                            if (e.key === "Escape") cancelEdit();
                          }}
                          onMouseEnter={(e) => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.borderColor = G; }}
                          onMouseLeave={(e) => (e.currentTarget.style.borderColor = B)}
                          onFocus={(e) => (e.currentTarget.style.borderColor = B)}
                          style={{
                            border: `3px solid ${B}`,
                            borderRadius: 0,
                            padding: "10px 12px",
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: "0.88rem",
                            background: W,
                            outline: "none",
                            boxSizing: "border-box",
                            transition: "border-color 0.15s",
                          }}
                        />
                        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                          <button
                            onClick={saveEdit}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = "translate(-3px, -3px)"; e.currentTarget.style.boxShadow = `6px 6px 0 ${B}`; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = `3px 3px 0 ${B}`; }}
                            style={{
                              background: G,
                              color: B,
                              border: `2px solid ${B}`,
                              boxShadow: `3px 3px 0 ${B}`,
                              padding: "10px 16px",
                              fontFamily: "'IBM Plex Mono', monospace",
                              fontWeight: 700,
                              fontSize: "0.7rem",
                              letterSpacing: "0.06em",
                              cursor: "pointer",
                              lineHeight: 1,
                              transition: "transform 0.15s, box-shadow 0.15s",
                            }}
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = "translate(-3px, -3px)"; e.currentTarget.style.boxShadow = `3px 3px 0 ${B}`; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
                            style={{
                              background: W,
                              color: B,
                              border: `2px solid ${B}`,
                              padding: "10px 16px",
                              fontFamily: "'IBM Plex Mono', monospace",
                              fontWeight: 700,
                              fontSize: "0.7rem",
                              letterSpacing: "0.06em",
                              cursor: "pointer",
                              lineHeight: 1,
                              transition: "transform 0.15s, box-shadow 0.15s",
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <SettingsField
                      label="ADDRESS"
                      value={[address, address2].filter(Boolean).join(", ")}
                      onEditStart={() => startEdit("address")}
                      onSave={saveEdit}
                      onCancel={cancelEdit}
                    />
                  )}
                  <SettingsField
                    label="CITY"
                    value={editingField === "city" ? editValue : city}
                    isEditing={editingField === "city"}
                    onChange={setEditValue}
                    onEditStart={() => startEdit("city")}
                    onSave={saveEdit}
                    onCancel={cancelEdit}
                  />
                  <SettingsField
                    label="POSTAL CODE"
                    value={
                      editingField === "postal_code" ? editValue : postalCode
                    }
                    isEditing={editingField === "postal_code"}
                    onChange={setEditValue}
                    onEditStart={() => startEdit("postal_code")}
                    onSave={saveEdit}
                    onCancel={cancelEdit}
                  />
                </div>
              </>
            )}

            {/* ── Account tab ── */}
            {activeTab === "account" && (
              <>
                <h2
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 800,
                    fontSize: "1.5rem",
                    letterSpacing: "-0.02em",
                    marginBottom: 32,
                    lineHeight: 1.1,
                  }}
                >
                  Account
                </h2>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 0,
                    marginBottom: 40,
                  }}
                >
                  <ReadOnlyRow label="EMAIL" value={user?.email ?? ""} />
                  <ReadOnlyRow label="PLAN" value={planLabel} />
                  <ReadOnlyRow
                    label="MEMBER SINCE"
                    value={
                      user?.created_at
                        ? formatMemberSince(user.created_at)
                        : "—"
                    }
                  />
                </div>

                <button
                  onClick={handleLogout}
                  style={{
                    width: "100%",
                    padding: "14px",
                    background: W,
                    border: `2px solid #cc0000`,
                    color: "#cc0000",
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontWeight: 700,
                    fontSize: "0.78rem",
                    letterSpacing: "0.08em",
                    cursor: "pointer",
                    boxShadow: `3px 3px 0 ${B}`,
                    transition: "background 0.15s, color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#cc0000";
                    e.currentTarget.style.color = W;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = W;
                    e.currentTarget.style.color = "#cc0000";
                  }}
                >
                  LOGOUT
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
