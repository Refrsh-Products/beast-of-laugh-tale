import { useState } from "react";
import type { ProfileTab } from "./ProfileSidebar";
import type { StoredAccount } from "../../storage";
import SettingsField from "../settings/SettingsField";
import useAccountService from "../../services/account";

const G = "#84e487";
const B = "#000000";
const W = "#FFFFFF";

interface ProfileTabProps {
  activeTab: ProfileTab;
}

type EditableField = "name" | "phone" | "address" | "city" | "postal_code";

export default function ProfileContentArea({ activeTab }: ProfileTabProps) {
  const accountService = useAccountService();
  const account = accountService.getAccount();
  const [name, setName] = useState(
    account ? `${account.first_name} ${account.last_name}`.trim() : "",
  );
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editAddress2, setEditAddress2] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [phone, setPhone] = useState(account?.phone ?? "");
  const [address, setAddress] = useState(account?.address1 ?? "");
  const [address2, setAddress2] = useState(account?.address2 ?? "");
  const [city, setCity] = useState(account?.city ?? "");
  const [postalCode, setPostalCode] = useState(account?.postal_code ?? "");
  const [success, setSuccess] = useState<string | null>(null);

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
  return (
    <>
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

          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
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
                    style={{
                      border: `3px solid ${B}`,
                      borderRadius: 0,
                      padding: "10px 12px",
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: "0.88rem",
                      background: W,
                      outline: "none",
                      boxSizing: "border-box",
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
                    style={{
                      border: `3px solid ${B}`,
                      borderRadius: 0,
                      padding: "10px 12px",
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: "0.88rem",
                      background: W,
                      outline: "none",
                      boxSizing: "border-box",
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
                      }}
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
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
                  ADDRESS
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
                    placeholder="Address line 1"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit();
                      if (e.key === "Escape") cancelEdit();
                    }}
                    style={{
                      border: `3px solid ${B}`,
                      borderRadius: 0,
                      padding: "10px 12px",
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: "0.88rem",
                      background: W,
                      outline: "none",
                      boxSizing: "border-box",
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
                    style={{
                      border: `3px solid ${B}`,
                      borderRadius: 0,
                      padding: "10px 12px",
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: "0.88rem",
                      background: W,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                    <button
                      onClick={saveEdit}
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
                      }}
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
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
              value={editingField === "postal_code" ? editValue : postalCode}
              isEditing={editingField === "postal_code"}
              onChange={setEditValue}
              onEditStart={() => startEdit("postal_code")}
              onSave={saveEdit}
              onCancel={cancelEdit}
            />
          </div>
        </>
      )}
    </>
  );
}
