import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { CommunityStatus } from "@freshr/shared";

import OnboardingPage from "../OnboardingPage";
import useAuthService from "../../services/auth";
import useAccountService from "../../services/account";
import { getGoogleProfile } from "../../storage";

vi.mock("../../services/auth");
vi.mock("../../services/account");
vi.mock("../../services/notebooks");
vi.mock("../../storage");

const navigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return { ...actual, useNavigate: () => navigate };
});

const COMMUNITY_LIVE: CommunityStatus = {
  enabled: true,
  invite_url: "https://chat.whatsapp.com/TestInvite",
  headline: "Join the FRESHR student community",
  message: "Study tips and updates.",
  opted_in_at: null,
};

const COMMUNITY_DISABLED: CommunityStatus = {
  enabled: false,
  invite_url: "",
  headline: "",
  message: "",
  opted_in_at: null,
};

function setup({
  community = COMMUNITY_LIVE,
  updateAccount = vi.fn().mockResolvedValue(undefined),
  joinCommunity = vi.fn().mockResolvedValue(COMMUNITY_LIVE),
} = {}) {
  vi.mocked(useAuthService).mockReturnValue({
    isLoggedIn: () => true,
  } as never);
  vi.mocked(useAccountService).mockReturnValue({
    getOnboardingStatus: vi.fn().mockResolvedValue("incomplete"),
    getCommunity: vi.fn().mockResolvedValue(community),
    updateAccount,
    joinCommunity,
  } as never);
  vi.mocked(getGoogleProfile).mockReturnValue(null as never);

  render(
    <MemoryRouter>
      <OnboardingPage />
    </MemoryRouter>,
  );
  return { updateAccount, joinCommunity };
}

/** Walk step 1 → step 2, fill the required fields, and submit. */
async function completeProfile() {
  await userEvent.click(await screen.findByRole("button", { name: "Get started" }));
  await userEvent.type(screen.getByLabelText(/first name/i), "Jane");
  await userEvent.type(screen.getByLabelText(/last name/i), "Smith");
  await userEvent.type(screen.getByLabelText(/phone number/i), "01700000000");
  await userEvent.click(screen.getByRole("button", { name: "Continue" }));
}

describe("OnboardingPage", () => {
  beforeEach(() => {
    navigate.mockClear();
    vi.stubGlobal("open", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("starts on the welcome step", async () => {
    setup();
    expect(await screen.findByText("Welcome to FRESHR")).toBeVisible();
  });

  it("saves the profile and advances to the community step", async () => {
    const { updateAccount } = setup();
    await completeProfile();

    await waitFor(() => expect(updateAccount).toHaveBeenCalledOnce());
    expect(updateAccount.mock.calls[0][0]).toMatchObject({
      first_name: "Jane",
      last_name: "Smith",
      phone: "01700000000",
      onboarding_completed: true,
    });
    expect(
      await screen.findByRole("button", { name: "Join on WhatsApp" }),
    ).toBeVisible();
  });

  it("skips the community step entirely when it is disabled", async () => {
    setup({ community: COMMUNITY_DISABLED });
    await completeProfile();

    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/dashboard"));
    expect(
      screen.queryByRole("button", { name: "Join on WhatsApp" }),
    ).not.toBeInTheDocument();
  });

  it("stays on the form and shows an error when the save fails", async () => {
    const updateAccount = vi.fn().mockRejectedValue(new Error("boom"));
    setup({ updateAccount });
    await completeProfile();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /failed to save your profile/i,
    );
    expect(navigate).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/first name/i)).toBeVisible();
  });

  it("does not submit when required fields are empty", async () => {
    const { updateAccount } = setup();
    await userEvent.click(
      await screen.findByRole("button", { name: "Get started" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /fill in all required fields/i,
    );
    expect(updateAccount).not.toHaveBeenCalled();
  });

  it("records the opt-in, opens WhatsApp and continues on Join", async () => {
    const { joinCommunity } = setup();
    await completeProfile();
    await userEvent.click(
      await screen.findByRole("button", { name: "Join on WhatsApp" }),
    );

    expect(window.open).toHaveBeenCalledWith(
      COMMUNITY_LIVE.invite_url,
      "_blank",
      "noopener,noreferrer",
    );
    expect(joinCommunity).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith("/dashboard");
  });

  it("still opens WhatsApp and continues when recording the opt-in fails", async () => {
    // The never-blocks invariant: the profile is already saved by this point,
    // so nothing on this step may trap the user.
    setup({ joinCommunity: vi.fn().mockRejectedValue(new Error("offline")) });
    await completeProfile();
    await userEvent.click(
      await screen.findByRole("button", { name: "Join on WhatsApp" }),
    );

    expect(window.open).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith("/dashboard");
  });

  it("continues without recording anything on Finish onboarding", async () => {
    const { joinCommunity } = setup();
    await completeProfile();
    await userEvent.click(
      await screen.findByRole("button", { name: "Finish onboarding" }),
    );

    expect(joinCommunity).not.toHaveBeenCalled();
    expect(window.open).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith("/dashboard");
  });
});
