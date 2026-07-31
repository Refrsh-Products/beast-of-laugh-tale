import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import { Button } from "@/components/ui/button";
import LegacyButton from "@/components/ui/LegacyButton";
import Dropdown from "@/components/ui/Dropdown";
import MobileDrawer from "@/components/ui/MobileDrawer";
import LoadErrorScreen from "@/components/ui/LoadErrorScreen";
import { Toaster } from "@/components/ui/sonner";
import { useToast, type ToastVariant } from "@/hooks/useToast";

/**
 * Assertions here are on classes, roles and behaviour — never on computed
 * colour. jsdom does not run Tailwind, so getComputedStyle would report the
 * same empty values whatever the palette did, and a test asserting rgb()
 * would pass even with the stylesheet deleted.
 */

describe("Button", () => {
  it("renders its children and fires onClick", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save notebook</Button>);

    await userEvent.click(
      screen.getByRole("button", { name: "Save notebook" }),
    );
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not fire onClick while disabled", async () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Save
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("applies the variant and size a caller asks for", () => {
    render(
      <Button variant="destructive" size="lg">
        Delete
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Delete" });
    expect(button).toHaveAttribute("data-variant", "destructive");
    expect(button).toHaveAttribute("data-size", "lg");
  });
});

describe("LegacyButton compatibility adapter", () => {
  it.each([
    ["primary", "default"],
    ["green", "default"],
    ["danger", "destructive"],
    ["default", "outline"],
  ] as const)("maps the %s variant onto %s", (legacy, expected) => {
    render(<LegacyButton variant={legacy}>Go</LegacyButton>);
    expect(screen.getByRole("button", { name: "Go" })).toHaveAttribute(
      "data-variant",
      expected,
    );
  });

  it("translates large and fullWidth onto the new API", () => {
    render(
      <LegacyButton large fullWidth>
        Continue
      </LegacyButton>,
    );
    const button = screen.getByRole("button", { name: "Continue" });
    expect(button).toHaveAttribute("data-size", "lg");
    expect(button.className).toContain("w-full");
  });

  it("still honours disabled", async () => {
    const onClick = vi.fn();
    render(
      <LegacyButton onClick={onClick} disabled>
        Retry
      </LegacyButton>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe("Dropdown", () => {
  const options = [
    { value: "easy", label: "Easy" },
    { value: "hard", label: "Hard" },
  ];

  it("shows the placeholder when nothing is selected", () => {
    render(
      <Dropdown
        value=""
        onChange={vi.fn()}
        placeholder="Pick difficulty"
        options={options}
      />,
    );
    expect(screen.getByText("Pick difficulty")).toBeInTheDocument();
  });

  it("reports the chosen value to onChange", async () => {
    const onChange = vi.fn();
    render(
      <Dropdown
        value="easy"
        onChange={onChange}
        placeholder="Pick difficulty"
        options={options}
      />,
    );

    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.click(screen.getByRole("option", { name: "Hard" }));
    expect(onChange).toHaveBeenCalledWith("hard");
  });

  it("exposes a combobox role and disabled state", () => {
    // The hand-rolled version was a plain <div> with a click handler, so it had
    // no role, no keyboard support and no way to announce itself.
    render(
      <Dropdown
        value=""
        onChange={vi.fn()}
        placeholder="Pick difficulty"
        options={options}
        disabled
      />,
    );
    expect(screen.getByRole("combobox")).toBeDisabled();
  });
});

describe("MobileDrawer", () => {
  it("renders nothing until it is opened", () => {
    render(
      <MobileDrawer open={false} onClose={vi.fn()}>
        <a href="/settings">Settings</a>
      </MobileDrawer>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders its children in a labelled modal dialog", () => {
    render(
      <MobileDrawer open onClose={vi.fn()} ariaLabel="Main navigation">
        <a href="/settings">Settings</a>
      </MobileDrawer>,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAccessibleName("Main navigation");
    expect(within(dialog).getByRole("link", { name: "Settings" })).toBeVisible();
  });

  it("closes on Escape", async () => {
    const onClose = vi.fn();
    render(
      <MobileDrawer open onClose={onClose}>
        <a href="/settings">Settings</a>
      </MobileDrawer>,
    );

    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });
});

describe("useToast over sonner", () => {
  function ToastProbe({
    message,
    variant,
  }: {
    message: string;
    variant: ToastVariant;
  }) {
    const { showToast } = useToast();
    return (
      <>
        <Toaster />
        <button type="button" onClick={() => showToast(message, variant)}>
          fire
        </button>
      </>
    );
  }

  it.each(["success", "danger", "neutral"] as const)(
    "surfaces a %s toast through the shared Toaster",
    async (variant) => {
      // Guards the swap from per-page toast state to sonner: the call sites
      // still use showToast(), so this is the only place the wiring is proven.
      render(<ToastProbe message={`${variant} happened`} variant={variant} />);

      await userEvent.click(screen.getByRole("button", { name: "fire" }));
      expect(await screen.findByText(`${variant} happened`)).toBeVisible();
    },
  );
});

describe("LoadErrorScreen", () => {
  it("retries when the button is pressed", async () => {
    const onRetry = vi.fn();
    render(
      <MemoryRouter>
        <LoadErrorScreen onRetry={onRetry} />
      </MemoryRouter>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("disables the button and shows progress while retrying", () => {
    render(
      <MemoryRouter>
        <LoadErrorScreen onRetry={vi.fn()} retrying />
      </MemoryRouter>,
    );
    expect(screen.getByRole("button", { name: "Retrying..." })).toBeDisabled();
  });
});
