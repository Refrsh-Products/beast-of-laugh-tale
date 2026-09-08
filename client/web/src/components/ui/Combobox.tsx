import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * A searchable single-select: type to filter, arrow keys to move, Enter to
 * commit. Built by hand rather than on Radix Select, whose roving-focus
 * typeahead swallows keystrokes from any input placed inside its content —
 * and every option label here contains a space, so it breaks immediately.
 * A native <datalist> was the other candidate, but its popup is un-themeable
 * and gives no way to tell a picked option from typed text, which `pinnedOption`
 * depends on.
 *
 * `pinnedOption` is the reason this exists rather than a plain Dropdown: it
 * renders below the results and is never removed by the filter, so a user whose
 * entry isn't in the list still sees the escape hatch after typing something
 * that matches nothing.
 */

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  pinnedOption?: ComboboxOption;
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  "aria-invalid"?: boolean;
  "aria-required"?: boolean;
}

export default function Combobox({
  value,
  onChange,
  options,
  pinnedOption,
  placeholder,
  emptyMessage = "No matches.",
  disabled = false,
  id,
  className,
  "aria-invalid": ariaInvalid,
  "aria-required": ariaRequired,
}: ComboboxProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);

  const selectedLabel =
    options.find((o) => o.value === value)?.label ??
    (value && value === pinnedOption?.value ? pinnedOption.label : "");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  // The pinned row is the last navigable item, after every filtered result.
  const navigable = useMemo(
    () => (pinnedOption ? [...filtered, pinnedOption] : filtered),
    [filtered, pinnedOption],
  );

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    // pointerdown, not click: a click fires after blur and would race a row's
    // own handler, committing nothing.
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function commit(option: ComboboxOption) {
    onChange(option.value);
    setOpen(false);
    setQuery("");
    setActiveIndex(-1);
  }

  function close() {
    setOpen(false);
    setQuery("");
    setActiveIndex(-1);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      if (navigable.length === 0) return;
      const delta = e.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((i) => {
        const next = i + delta;
        if (next < 0) return navigable.length - 1;
        if (next >= navigable.length) return 0;
        return next;
      });
      return;
    }

    if (e.key === "Enter") {
      // Always swallow Enter while open — this control lives inside a real
      // <form>, so letting it bubble would submit the page.
      if (!open) return;
      e.preventDefault();
      const target =
        activeIndex >= 0
          ? navigable[activeIndex]
          : filtered.length === 1
            ? filtered[0]
            : undefined;
      if (target) commit(target);
      return;
    }

    if (e.key === "Escape") {
      if (!open) return;
      e.preventDefault();
      close();
      return;
    }

    if (e.key === "Tab" && open) close();
  }

  const optionId = (index: number) => `${listId}-option-${index}`;

  function renderRow(option: ComboboxOption, index: number, pinned = false) {
    const isActive = index === activeIndex;
    return (
      <li
        key={option.value}
        id={optionId(index)}
        role="option"
        aria-selected={option.value === value}
        // Keep focus in the input so the blur doesn't beat the click.
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => commit(option)}
        onMouseEnter={() => setActiveIndex(index)}
        className={cn(
          "cursor-pointer rounded-xl px-3 py-2 text-sm",
          pinned && "text-muted-foreground",
          isActive && "bg-accent text-accent-foreground",
        )}
      >
        {option.label}
      </li>
    );
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <Input
        id={id}
        role="combobox"
        autoComplete="off"
        disabled={disabled}
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          open && activeIndex >= 0 ? optionId(activeIndex) : undefined
        }
        aria-invalid={ariaInvalid}
        aria-required={ariaRequired}
        placeholder={placeholder}
        value={open ? query : selectedLabel}
        onChange={(e) => {
          setQuery(e.target.value);
          setActiveIndex(-1);
          if (!open) setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />

      {open && (
        <ul
          id={listId}
          role="listbox"
          className="border-border bg-popover absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-2xl border p-1 shadow-md"
        >
          {filtered.length === 0 && (
            <li className="text-muted-foreground px-3 py-2 text-sm">
              {emptyMessage}
            </li>
          )}
          {filtered.map((option, i) => renderRow(option, i))}
          {pinnedOption && (
            <>
              {filtered.length > 0 && (
                <li
                  role="presentation"
                  className="border-border mx-1 mt-1 border-t pt-1"
                />
              )}
              {renderRow(pinnedOption, filtered.length, true)}
            </>
          )}
        </ul>
      )}
    </div>
  );
}
