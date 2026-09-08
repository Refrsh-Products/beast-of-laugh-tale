import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

import Combobox, { type ComboboxOption } from "@/components/ui/Combobox";

/**
 * Assertions are on roles and behaviour, never computed colour — jsdom doesn't
 * run Tailwind, so a getComputedStyle assertion would pass with the stylesheet
 * deleted.
 */

const OPTIONS: ComboboxOption[] = [
  { value: "BRAC University", label: "BRAC University" },
  { value: "North South University", label: "North South University" },
  { value: "University of Dhaka", label: "University of Dhaka" },
];

const PINNED: ComboboxOption = { value: "__other__", label: "Other" };

function Harness({
  onChange = vi.fn(),
  onSubmit,
}: {
  onChange?: (v: string) => void;
  onSubmit?: () => void;
}) {
  const [value, setValue] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
    >
      <Combobox
        value={value}
        onChange={(v) => {
          setValue(v);
          onChange(v);
        }}
        options={OPTIONS}
        pinnedOption={PINNED}
        placeholder="Search"
        emptyMessage="No matches — choose Other below."
      />
    </form>
  );
}

describe("Combobox", () => {
  it("opens on focus and lists every option", async () => {
    render(<Harness />);
    const input = screen.getByRole("combobox");
    expect(input).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(input);

    expect(input).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("option")).toHaveLength(OPTIONS.length + 1);
  });

  it("filters as you type, case-insensitively", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.keyboard("north");

    const options = screen.getAllByRole("option").map((o) => o.textContent);
    expect(options).toEqual(["North South University", "Other"]);
  });

  it("keeps the pinned option visible when nothing matches", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.keyboard("nonesuch");

    expect(screen.getByText("No matches — choose Other below.")).toBeVisible();
    const options = screen.getAllByRole("option").map((o) => o.textContent);
    expect(options).toEqual(["Other"]);
  });

  it("commits a clicked option and shows its label", async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.click(screen.getByRole("option", { name: "BRAC University" }));

    expect(onChange).toHaveBeenCalledWith("BRAC University");
    expect(screen.getByRole("combobox")).toHaveValue("BRAC University");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("commits the pinned option", async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.click(screen.getByRole("option", { name: "Other" }));

    expect(onChange).toHaveBeenCalledWith("__other__");
  });

  it("commits the active row on Enter without submitting the form", async () => {
    const onChange = vi.fn();
    const onSubmit = vi.fn();
    render(<Harness onChange={onChange} onSubmit={onSubmit} />);

    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.keyboard("{ArrowDown}{Enter}");

    expect(onChange).toHaveBeenCalledWith("BRAC University");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("commits the sole match on Enter with no arrow navigation", async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.keyboard("dhaka{Enter}");

    expect(onChange).toHaveBeenCalledWith("University of Dhaka");
  });

  it("closes on Escape without committing", async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.keyboard("brac{Escape}");

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveValue("");
  });

  it("closes on an outside pointerdown without committing", async () => {
    const onChange = vi.fn();
    render(
      <>
        <Harness onChange={onChange} />
        <button type="button">elsewhere</button>
      </>,
    );

    await userEvent.click(screen.getByRole("combobox"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "elsewhere" }));

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("tracks the active row with aria-activedescendant", async () => {
    render(<Harness />);
    const input = screen.getByRole("combobox");

    await userEvent.click(input);
    expect(input).not.toHaveAttribute("aria-activedescendant");

    await userEvent.keyboard("{ArrowDown}");
    const active = input.getAttribute("aria-activedescendant");
    expect(active).toBeTruthy();
    expect(document.getElementById(active!)).toHaveTextContent(
      "BRAC University",
    );
  });
});
