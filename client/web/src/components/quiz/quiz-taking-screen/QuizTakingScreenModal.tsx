import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * The shell the three quiz-taking modals share.
 *
 * Each caller mounts this conditionally rather than driving an `open` prop, so
 * the dialog is open for as long as it exists and `onClose` stands in for
 * Radix's dismiss events. Omitting `onClose` makes the modal non-dismissable —
 * "time's up" has no way back, the only exit is the action button.
 *
 * Title and description are props rather than free children because Radix
 * requires a labelled dialog; passing them through guarantees every modal is
 * announced instead of relying on each one to remember.
 */
export default function QuizTakingScreenModal({
  title,
  description,
  onClose,
  children,
}: {
  title: React.ReactNode;
  description: React.ReactNode;
  onClose?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose?.();
      }}
    >
      <DialogContent
        showCloseButton={Boolean(onClose)}
        className="sm:max-w-sm"
        // Without a dismiss handler there is no way to decline, so swallow the
        // gestures Radix would otherwise close on.
        onEscapeKeyDown={onClose ? undefined : (e) => e.preventDefault()}
        onInteractOutside={onClose ? undefined : (e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>{children}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
