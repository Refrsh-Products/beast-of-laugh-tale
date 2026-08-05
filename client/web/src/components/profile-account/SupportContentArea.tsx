import type { ProfileTab } from "./ProfileSidebar";
import {
  SupportDetails,
  SupportForm,
  SupportLegalLinks,
} from "../support/SupportContact";

interface SupportContentAreaProps {
  activeTab: ProfileTab;
  defaultName?: string;
  defaultEmail?: string;
}

export default function SupportContentArea({
  activeTab,
  defaultName = "",
  defaultEmail = "",
}: SupportContentAreaProps) {
  if (activeTab !== "support") return null;

  return (
    <div>
      <h1 className="font-heading text-foreground mb-2 text-3xl leading-tight font-bold tracking-tight">
        Support
      </h1>
      <p className="text-muted-foreground mb-7 text-sm leading-relaxed">
        Send us a message and our team will get back to you.
      </p>

      <SupportDetails />
      <SupportForm defaultName={defaultName} defaultEmail={defaultEmail} />
      <SupportLegalLinks />
    </div>
  );
}
