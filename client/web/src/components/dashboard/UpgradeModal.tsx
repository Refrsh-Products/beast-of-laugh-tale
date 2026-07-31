import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RiSparkling2Line } from "@remixicon/react";

export default function UpgradeModal({
  onClose,
  title = "You've hit your plan limit",
  description = "Upgrade to Pro for unlimited notebooks, more storage and higher daily quiz and presentation limits.",
}: {
  onClose: () => void;
  title?: string;
  description?: string;
}) {
  const navigate = useNavigate();

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <span className="bg-secondary text-secondary-foreground mb-1 flex size-11 items-center justify-center rounded-full">
            <RiSparkling2Line className="size-5" aria-hidden="true" />
          </span>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Not now
          </Button>
          <Button
            onClick={() => navigate("/profile", { state: { tab: "payment" } })}
          >
            See plans
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
