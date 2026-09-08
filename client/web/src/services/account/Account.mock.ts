import {
  getAccount,
  saveAccount,
  hasCompletedOnboarding,
  getNotebooks,
} from "../../storage";
import type {
  AccountService,
  CommunityStatus,
  OnboardingStatus,
} from "@freshr/shared";

// Enabled so the onboarding community step is reachable under VITE_USE_MOCK.
// Kept in module scope so join/leave persist for the session.
let mockOptedInAt: string | null = null;
const mockCommunity = (): CommunityStatus => ({
  enabled: true,
  invite_url: "https://chat.whatsapp.com/MockInviteCode",
  headline: "Join the FRESHR student community",
  message:
    "Study tips, feature updates and a direct line to the team. It's a WhatsApp group, and you can leave any time.",
  opted_in_at: mockOptedInAt,
});

const AccountServiceMock: AccountService = {
  getAccount: async () => {
    const account = getAccount();
    if (!account) return null;
    return { account, onboardingCompleted: hasCompletedOnboarding() };
  },

  saveAccount: (account) => {
    saveAccount(account);
    return Promise.resolve();
  },

  updateAccount: (account) => {
    const current = getAccount();
    if (current) saveAccount({ ...current, ...account } as typeof current);
    return Promise.resolve();
  },

  getOnboardingStatus: (): Promise<OnboardingStatus> =>
    Promise.resolve(hasCompletedOnboarding() ? "complete" : "incomplete"),

  getAccountUsage: () => {
    const notebooks = getNotebooks();
    return Promise.resolve({
      plan: "free",
      notebooks: { used: notebooks.length, limit: 3 },
      storage: {
        used_bytes: BigInt(0),
        limit_bytes: BigInt(500 * 1024 * 1024),
      },
      daily_quizzes: { used: 0, limit: 5 },
      presentations: { used: 0, limit: 2 },
      // The real API returns this; without it the audio tool is permanently
      // locked behind its upsell in mock mode and can't be worked on.
      features: { audio_notes: true },
    });
  },

  getCommunity: () => Promise.resolve(mockCommunity()),

  joinCommunity: () => {
    // Idempotent, like the server: the first tap wins.
    mockOptedInAt ??= new Date().toISOString();
    return Promise.resolve(mockCommunity());
  },

  leaveCommunity: () => {
    mockOptedInAt = null;
    return Promise.resolve(mockCommunity());
  },
};

export default AccountServiceMock;
