import { useCallback, useEffect, useRef, useState } from "react";

interface UseMobileMenuResult {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  panelRef: React.RefObject<HTMLDivElement | null>;
}

export function useMobileMenu(): UseMobileMenuResult {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    setIsOpen(false);
    // Return focus to the menu button when the panel closes
    buttonRef.current?.focus();
  }, []);
  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    };

    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedInside =
        buttonRef.current?.contains(target) || panelRef.current?.contains(target);
      if (!clickedInside) {
        close();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleMouseDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [isOpen, close]);

  return { isOpen, open, close, toggle, buttonRef, panelRef };
}
