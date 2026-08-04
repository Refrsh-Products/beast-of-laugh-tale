import { useState, useEffect, type ReactNode } from "react";
import type { ProfileTab } from "./ProfileSidebar";
import type { StoredAccount } from "@freshr/shared";
import { getAccount as getCachedAccount } from "../../storage";
import SettingsField from "../settings/SettingsField";
import useAccountService from "../../services/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProfileTabProps {
  activeTab: ProfileTab;
}

type EditableField = "name" | "phone" | "address" | "city" | "postal_code";

/**
 * A field that edits two inputs at once — name (first/last) and address
 * (line 1/line 2). Both previously inlined the same block of markup twice
 * over, each with its own imperative border-colour handlers.
 */
function TwoPartField({
  label,
  error,
  onSave,
  onCancel,
  children,
}: {
  label: string;
  error?: string | null;
  onSave: () => void;
  onCancel: () => void;
  children: ReactNode;
}) {
  return (
    <div className="border-border border-b pb-5">
      <Label className="text-muted-foreground mb-2 text-xs font-semibold tracking-[0.14em] uppercase">
        {label}
      </Label>
      <div className="flex flex-col gap-2">
        {children}
        {error && (
          <p role="alert" className="text-destructive text-xs">
            {error}
          </p>
        )}
        <div className="mt-1 flex gap-2.5">
          <Button onClick={onSave}>Save</Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ProfileContentArea({ activeTab }: ProfileTabProps) {
  const accountService = useAccountService();
  const cached = getCachedAccount();
  const [account, setAccount] = useState<StoredAccount | null>(cached);
  const [name, setName] = useState(
    cached ? `${cached.first_name} ${cached.last_name}`.trim() : "",
  );
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editAddress2, setEditAddress2] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [phone, setPhone] = useState(cached?.phone ?? "");
  const [address, setAddress] = useState(cached?.address1 ?? "");
  const [address2, setAddress2] = useState(cached?.address2 ?? "");
  const [city, setCity] = useState(cached?.city ?? "");
  const [postalCode, setPostalCode] = useState(cached?.postal_code ?? "");
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    accountService
      .getAccount()
      .then((res) => {
        if (!res) return;
        const acc = res.account;
        setAccount(acc);
        setName(`${acc.first_name} ${acc.last_name}`.trim());
        setPhone(acc.phone ?? "");
        setAddress(acc.address1 ?? "");
        setAddress2(acc.address2 ?? "");
        setCity(acc.city ?? "");
        setPostalCode(acc.postal_code ?? "");
      })
      .catch(() => {});
  }, []);

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

  /** Enter commits, Escape cancels — same on every input in this panel. */
  function keyHandler(e: React.KeyboardEvent) {
    if (e.key === "Enter") saveEdit();
    if (e.key === "Escape") cancelEdit();
  }

  if (activeTab !== "profile") return null;

  return (
    <>
      <h2 className="font-heading text-foreground mb-8 text-2xl leading-tight font-bold tracking-tight">
        Profile
      </h2>

      {success && (
        <div
          role="status"
          className="border-border bg-secondary text-secondary-foreground mb-6 rounded-2xl border px-4 py-3 text-sm font-semibold"
        >
          {success}
        </div>
      )}

      <div className="flex flex-col">
        {editingField === "name" ? (
          <TwoPartField
            label="Name"
            error={nameError}
            onSave={saveEdit}
            onCancel={cancelEdit}
          >
            <Input
              autoFocus
              required
              placeholder="First name"
              aria-label="First name"
              value={editFirstName}
              onChange={(e) => setEditFirstName(e.target.value)}
              onKeyDown={keyHandler}
            />
            <Input
              required
              placeholder="Last name"
              aria-label="Last name"
              value={editLastName}
              onChange={(e) => setEditLastName(e.target.value)}
              onKeyDown={keyHandler}
            />
          </TwoPartField>
        ) : (
          <SettingsField
            label="Name"
            value={name}
            onEditStart={() => startEdit("name")}
            onSave={saveEdit}
            onCancel={cancelEdit}
          />
        )}

        <SettingsField
          label="Phone"
          value={editingField === "phone" ? editValue : phone}
          isEditing={editingField === "phone"}
          onChange={setEditValue}
          onEditStart={() => startEdit("phone")}
          onSave={saveEdit}
          onCancel={cancelEdit}
        />

        {editingField === "address" ? (
          <TwoPartField
            label="Address"
            onSave={saveEdit}
            onCancel={cancelEdit}
          >
            <Input
              autoFocus
              required
              placeholder="Address line 1"
              aria-label="Address line 1"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={keyHandler}
            />
            <Input
              placeholder="Address line 2 (optional)"
              aria-label="Address line 2"
              value={editAddress2}
              onChange={(e) => setEditAddress2(e.target.value)}
              onKeyDown={keyHandler}
            />
          </TwoPartField>
        ) : (
          <SettingsField
            label="Address"
            value={[address, address2].filter(Boolean).join(", ")}
            onEditStart={() => startEdit("address")}
            onSave={saveEdit}
            onCancel={cancelEdit}
          />
        )}

        <SettingsField
          label="City"
          value={editingField === "city" ? editValue : city}
          isEditing={editingField === "city"}
          onChange={setEditValue}
          onEditStart={() => startEdit("city")}
          onSave={saveEdit}
          onCancel={cancelEdit}
        />

        <SettingsField
          label="Postal code"
          value={editingField === "postal_code" ? editValue : postalCode}
          isEditing={editingField === "postal_code"}
          onChange={setEditValue}
          onEditStart={() => startEdit("postal_code")}
          onSave={saveEdit}
          onCancel={cancelEdit}
        />
      </div>
    </>
  );
}
