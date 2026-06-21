import { useState, useEffect } from "react";
import type { ProfileTab } from "./ProfileSidebar";
import type { StoredAccount } from "@freshr/shared";
import { getAccount as getCachedAccount } from "../../storage";
import SettingsField from "../settings/SettingsField";
import Button from "../ui/Button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import useAccountService from "../../services/account";

interface ProfileTabProps {
  activeTab: ProfileTab;
}

type EditableField = "name" | "phone" | "address" | "city" | "postal_code";

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
    accountService.getAccount().then((res) => {
      if (!res) return;
      const acc = res.account;
      setAccount(acc);
      setName(`${acc.first_name} ${acc.last_name}`.trim());
      setPhone(acc.phone ?? "");
      setAddress(acc.address1 ?? "");
      setAddress2(acc.address2 ?? "");
      setCity(acc.city ?? "");
      setPostalCode(acc.postal_code ?? "");
    }).catch(() => {});
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
      const valueMap: Record<string, string> = { phone, city, postal_code: postalCode };
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
        setNameError(!fn ? "First name is required." : "Last name is required.");
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
        postal_code: editingField === "postal_code" ? trimmed : account.postal_code,
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
      setSuccess(`${editingField.charAt(0).toUpperCase() + editingField.slice(1)} updated.`);
    } catch {
      setSuccess("Failed to save. Please try again.");
    }
  }

  if (activeTab !== "profile") return null;

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-6">Profile</h2>

      {success && (
        <div className="rounded-md border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary font-medium mb-5">
          {success}
        </div>
      )}

      <div className="flex flex-col">
        {/* Name — custom two-field edit */}
        {editingField === "name" ? (
          <div className="py-4 border-b border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Name</p>
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  autoFocus
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
                  placeholder="First name"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
                  placeholder="Last name"
                />
              </div>
              {nameError && <p className="text-xs text-destructive">{nameError}</p>}
              <div className="flex gap-2 mt-1">
                <Button variant="green" onClick={saveEdit}>Save</Button>
                <Button variant="default" onClick={cancelEdit}>Cancel</Button>
              </div>
            </div>
          </div>
        ) : (
          <SettingsField label="Name" value={name} onEditStart={() => startEdit("name")} onSave={saveEdit} onCancel={cancelEdit} />
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

        {/* Address — custom two-field edit */}
        {editingField === "address" ? (
          <div className="py-4 border-b border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Address</p>
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="addr1">Address line 1</Label>
                <Input
                  id="addr1"
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
                  placeholder="Address line 1"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="addr2">Address line 2 <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input
                  id="addr2"
                  value={editAddress2}
                  onChange={(e) => setEditAddress2(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
                  placeholder="Address line 2"
                />
              </div>
              <div className="flex gap-2 mt-1">
                <Button variant="green" onClick={saveEdit}>Save</Button>
                <Button variant="default" onClick={cancelEdit}>Cancel</Button>
              </div>
            </div>
          </div>
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
    </div>
  );
}
