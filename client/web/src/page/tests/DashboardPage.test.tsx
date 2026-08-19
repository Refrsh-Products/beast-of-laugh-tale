import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import type { Notebook, AccountUsage } from "@freshr/shared";

import DashboardPage from "../DashboardPage";
import useAuthService from "../../services/auth";
import useAccountService from "../../services/account";
import useNotebookService from "../../services/notebooks";
import { getAccount as getCachedAccount } from "../../storage";

vi.mock("../../services/auth");
vi.mock("../../services/account");
vi.mock("../../services/notebooks");
vi.mock("../../storage");

const ACCOUNT = {
  id: "acc-1",
  first_name: "Amara",
  last_name: "Okafor",
  profile_picture_url: "",
};

const USAGE: AccountUsage = {
  plan: "FREE",
  notebooks: { used: 1, limit: 3 },
  storage: { used_bytes: BigInt(2_097_152), limit_bytes: BigInt(10_485_760) },
  daily_quizzes: { used: 2, limit: 5 },
  presentations: { used: 0, limit: 2 },
};

function notebook(overrides: Partial<Notebook> = {}): Notebook {
  return {
    id: "nb-1",
    title: "Cellular Structures",
    created_at: "2026-07-01T10:00:00Z",
    updated_at: "2026-07-01T10:00:00Z",
    pinned: false,
    is_archived: false,
    ...overrides,
  };
}

let notebooks: Notebook[] = [];
let archived: Notebook[] = [];
let usage: AccountUsage | null = USAGE;
let account: typeof ACCOUNT | null = ACCOUNT;
/**
 * Held here rather than read back off the mock's call history: beforeEach
 * installs a fresh set of spies each test, but mock.results still holds every
 * earlier test's return value, so results[0] would be a stale object.
 */
let notebookService: Record<string, ReturnType<typeof vi.fn>>;

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/login" element={<div data-testid="login-page" />} />
        <Route path="/notebook/:id" element={<div data-testid="notebook-page" />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  notebooks = [notebook()];
  archived = [];
  usage = USAGE;
  account = ACCOUNT;

  vi.mocked(getCachedAccount).mockImplementation(() => account as any);

  vi.mocked(useAuthService).mockReturnValue({
    isLoggedIn: () => true,
    getUser: () => ({ email: "amara@example.com" }),
    logout: vi.fn(),
  } as any);

  vi.mocked(useAccountService).mockReturnValue({
    getAccount: () =>
      Promise.resolve({ account, onboardingCompleted: true }),
    getAccountUsage: () =>
      usage ? Promise.resolve(usage) : Promise.reject(new Error("no usage")),
  } as any);

  notebookService = {
    list: vi.fn(() => Promise.resolve(notebooks)),
    listArchived: vi.fn(() => Promise.resolve(archived)),
    listFiles: vi.fn(() => Promise.resolve([{ id: "f1" }, { id: "f2" }])),
    create: vi.fn(() => Promise.resolve({})),
    update: vi.fn(() => Promise.resolve({})),
    archive: vi.fn(() => Promise.resolve({})),
    unarchive: vi.fn(() => Promise.resolve({})),
    delete: vi.fn(() => Promise.resolve({})),
  };
  vi.mocked(useNotebookService).mockReturnValue(notebookService as any);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("DashboardPage usage overview", () => {
  it("renders every quota as 'used of limit'", async () => {
    renderDashboard();

    const overview = await screen.findByRole("region", {
      name: /usage overview/i,
    });
    expect(within(overview).getByText("1 of 3")).toBeInTheDocument();
    expect(within(overview).getByText("2 of 5")).toBeInTheDocument();
    expect(within(overview).getByText("0 of 2")).toBeInTheDocument();
    // Storage is byte-formatted rather than raw.
    expect(within(overview).getByText("2MB of 10MB")).toBeInTheDocument();
  });

  it("reports each quota's percentage on its progress bar", async () => {
    renderDashboard();
    await screen.findByRole("region", { name: /usage overview/i });

    expect(
      screen.getByRole("progressbar", { name: /notebooks usage/i }),
    ).toHaveAttribute("aria-valuenow", "33");
    expect(
      screen.getByRole("progressbar", { name: /daily quizzes usage/i }),
    ).toHaveAttribute("aria-valuenow", "40");
  });

  it("clamps an over-quota bar at 100% instead of overflowing", async () => {
    // Reachable after a plan downgrade: usage can exceed the new limit.
    usage = { ...USAGE, notebooks: { used: 9, limit: 3 } };
    renderDashboard();
    await screen.findByRole("region", { name: /usage overview/i });

    expect(
      screen.getByRole("progressbar", { name: /notebooks usage/i }),
    ).toHaveAttribute("aria-valuenow", "100");
  });

  it("does not divide by zero when a limit is zero", async () => {
    usage = { ...USAGE, presentations: { used: 0, limit: 0 } };
    renderDashboard();
    await screen.findByRole("region", { name: /usage overview/i });

    expect(
      screen.getByRole("progressbar", { name: /presentations usage/i }),
    ).toHaveAttribute("aria-valuenow", "0");
  });
});

describe("DashboardPage greeting", () => {
  it("greets the user by first name", async () => {
    renderDashboard();
    expect(
      await screen.findByRole("heading", { name: /Amara/ }),
    ).toBeInTheDocument();
  });

  it("falls back to a neutral greeting when the account has no name", async () => {
    account = { ...ACCOUNT, first_name: "", last_name: "" };
    renderDashboard();

    const heading = await screen.findByRole("heading", { level: 1 });
    // Must not render a dangling "Good morning, " with nothing after it.
    expect(heading).toHaveTextContent(/, there$/);
  });

  it("varies with the time of day", async () => {
    // shouldAdvanceTime keeps testing-library's async polling alive; a plain
    // fake-timer clock freezes findBy* until the 5s test timeout.
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-07-31T20:00:00"));
    renderDashboard();

    expect(
      await screen.findByRole("heading", { name: /Good evening/ }),
    ).toBeInTheDocument();
  });
});

describe("DashboardPage notebook list", () => {
  it("shows the create tile alongside the notebooks", async () => {
    renderDashboard();
    expect(await screen.findByText("Cellular Structures")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create new notebook/i }),
    ).toBeInTheDocument();
  });

  it("shows an onboarding empty state and no create tile when there are none", async () => {
    notebooks = [];
    renderDashboard();

    expect(await screen.findByText("No notebooks yet")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /create new notebook/i }),
    ).not.toBeInTheDocument();
  });

  it("filters the list by search query", async () => {
    notebooks = [
      notebook(),
      notebook({ id: "nb-2", title: "European Renaissance" }),
    ];
    renderDashboard();
    await screen.findByText("Cellular Structures");

    await userEvent.type(
      screen.getByRole("searchbox", { name: /search notebooks/i }),
      "renaiss",
    );

    expect(screen.getByText("European Renaissance")).toBeInTheDocument();
    expect(screen.queryByText("Cellular Structures")).not.toBeInTheDocument();
  });

  it("explains when a search matches nothing", async () => {
    renderDashboard();
    await screen.findByText("Cellular Structures");

    await userEvent.type(
      screen.getByRole("searchbox", { name: /search notebooks/i }),
      "quantum",
    );

    expect(screen.getByText("No matches")).toBeInTheDocument();
  });

  it("sorts pinned notebooks ahead of the rest", async () => {
    notebooks = [
      notebook({ id: "nb-1", title: "Older" }),
      notebook({ id: "nb-2", title: "Pinned one", pinned: true }),
    ];
    renderDashboard();
    await screen.findByText("Pinned one");

    const titles = screen
      .getAllByTestId("notebook-card")
      .map((card) => within(card).getByRole("heading").textContent);
    expect(titles).toEqual(["Pinned one", "Older"]);
  });

  it("opens a notebook when its card is clicked", async () => {
    renderDashboard();
    await userEvent.click(await screen.findByText("Cellular Structures"));
    expect(screen.getByTestId("notebook-page")).toBeInTheDocument();
  });
});

describe("DashboardPage tabs", () => {
  it("swaps active notebooks for archived ones", async () => {
    archived = [notebook({ id: "nb-9", title: "Last term stats", is_archived: true })];
    renderDashboard();
    await screen.findByText("Cellular Structures");

    await userEvent.click(screen.getByRole("tab", { name: /archived/i }));

    expect(await screen.findByText("Last term stats")).toBeInTheDocument();
    expect(screen.queryByText("Cellular Structures")).not.toBeInTheDocument();
  });

  it("explains the archived tab when it is empty", async () => {
    renderDashboard();
    await screen.findByText("Cellular Structures");

    await userEvent.click(screen.getByRole("tab", { name: /archived/i }));
    expect(await screen.findByText("Nothing archived")).toBeInTheDocument();
  });
});

describe("DashboardPage card actions", () => {
  async function openCardMenu(title: string) {
    await userEvent.click(
      await screen.findByRole("button", { name: `Actions for ${title}` }),
    );
    return screen.findByRole("menu");
  }

  it("offers the full action set for a notebook", async () => {
    renderDashboard();
    const menu = await openCardMenu("Cellular Structures");

    // The trigger sits over the title's stretched click overlay, so this also
    // guards the stacking that keeps it reachable at all.
    expect(within(menu).getByRole("menuitem", { name: /pin/i })).toBeVisible();
    expect(
      within(menu).getByRole("menuitem", { name: /rename/i }),
    ).toBeVisible();
    expect(
      within(menu).getByRole("menuitem", { name: /archive/i }),
    ).toBeVisible();
    expect(
      within(menu).getByRole("menuitem", { name: /delete/i }),
    ).toBeVisible();
  });

  it("labels the pin action by current state", async () => {
    notebooks = [notebook({ pinned: true })];
    renderDashboard();
    const menu = await openCardMenu("Cellular Structures");
    expect(within(menu).getByRole("menuitem", { name: "Unpin" })).toBeVisible();
  });

  it("archives through the service and refreshes", async () => {
    renderDashboard();
    const menu = await openCardMenu("Cellular Structures");
    await userEvent.click(
      within(menu).getByRole("menuitem", { name: /archive/i }),
    );
    expect(notebookService.archive).toHaveBeenCalledWith("nb-1");
  });

  it("confirms before deleting", async () => {
    renderDashboard();
    const menu = await openCardMenu("Cellular Structures");
    await userEvent.click(
      within(menu).getByRole("menuitem", { name: /delete/i }),
    );

    const dialog = await screen.findByRole("dialog", { name: /delete/i });
    expect(notebookService.delete).not.toHaveBeenCalled();

    await userEvent.click(
      within(dialog).getByRole("button", { name: /delete notebook/i }),
    );
    expect(notebookService.delete).toHaveBeenCalledWith("nb-1");
  });

  it("renames inline and commits on Enter", async () => {
    renderDashboard();
    const menu = await openCardMenu("Cellular Structures");
    await userEvent.click(
      within(menu).getByRole("menuitem", { name: /rename/i }),
    );

    const input = await screen.findByRole("textbox", {
      name: /notebook title/i,
    });
    await userEvent.clear(input);
    await userEvent.type(input, "Cell Biology{Enter}");
    expect(notebookService.update).toHaveBeenCalledWith("nb-1", {
      title: "Cell Biology",
    });
  });

  it("discards an inline rename on Escape", async () => {
    renderDashboard();
    const menu = await openCardMenu("Cellular Structures");
    await userEvent.click(
      within(menu).getByRole("menuitem", { name: /rename/i }),
    );

    const input = await screen.findByRole("textbox", {
      name: /notebook title/i,
    });
    await userEvent.clear(input);
    await userEvent.type(input, "Discard me{Escape}");
    expect(notebookService.update).not.toHaveBeenCalled();
  });
});

describe("DashboardPage quota enforcement", () => {
  it("opens the create dialog when there is room", async () => {
    renderDashboard();
    await screen.findByText("Cellular Structures");

    await userEvent.click(
      screen.getByRole("button", { name: /create new notebook/i }),
    );
    expect(
      await screen.findByRole("dialog", { name: /create a notebook/i }),
    ).toBeInTheDocument();
  });

  it("offers an upgrade instead of the create dialog at the limit", async () => {
    usage = { ...USAGE, notebooks: { used: 3, limit: 3 } };
    renderDashboard();
    await screen.findByText("Cellular Structures");

    await userEvent.click(
      screen.getByRole("button", { name: /create new notebook/i }),
    );

    expect(
      await screen.findByRole("dialog", { name: /notebook limit reached/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("dialog", { name: /create a notebook/i }),
    ).not.toBeInTheDocument();
  });

  it("rejects an empty title rather than creating a nameless notebook", async () => {
    renderDashboard();
    await screen.findByText("Cellular Structures");

    await userEvent.click(
      screen.getByRole("button", { name: /create new notebook/i }),
    );
    const dialog = await screen.findByRole("dialog", {
      name: /create a notebook/i,
    });
    await userEvent.click(
      within(dialog).getByRole("button", { name: /create notebook/i }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Please enter a title.",
    );
  });
});

describe("DashboardPage authentication", () => {
  // (kept last: this test swaps the auth mock wholesale)
  it("redirects to /login when not authenticated", () => {
    vi.mocked(useAuthService).mockReturnValue({
      isLoggedIn: () => false,
      getUser: () => null,
      logout: vi.fn(),
    } as any);
    renderDashboard();
    expect(screen.getByTestId("login-page")).toBeInTheDocument();
  });
});
