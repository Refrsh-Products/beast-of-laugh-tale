import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { PaymentFallbackStatus } from "@freshr/shared";

import PaymentContentArea from "../PaymentContentArea";
import usePaymentService from "../../../services/payment";
import useAccountService from "../../../services/account";

vi.mock("../../../services/payment");
vi.mock("../../../services/account");

const ACCOUNT = {
  id: "acc-1",
  first_name: "Amara",
  last_name: "Okafor",
  phone: "01711111111",
  tier_plan: "FREE",
  billing_interval: null,
  subscription_status: "INACTIVE",
};

const FALLBACK_ON: PaymentFallbackStatus = {
  enabled: true,
  headline: "Online payment is temporarily unavailable",
  message: "Leave your details and our team will contact you.",
  whatsapp_url: "https://wa.me/8801712345678",
};

const FALLBACK_OFF: PaymentFallbackStatus = { ...FALLBACK_ON, enabled: false };

let paymentService: Record<string, ReturnType<typeof vi.fn>>;

/**
 * `initiate` returning 502 is how the frontend learns the gateway is down
 * before anyone has flipped the admin toggle, so the shape of that rejection
 * matters as much as its existence.
 */
const gatewayDownError = () =>
  Object.assign(new Error("Bad Gateway"), { response: { status: 502 } });

beforeEach(() => {
  vi.mocked(useAccountService).mockReturnValue({
    getAccount: () => Promise.resolve({ account: ACCOUNT }),
  } as never);

  paymentService = {
    getFallbackStatus: vi.fn(() => Promise.resolve(FALLBACK_OFF)),
    initializePayment: vi.fn(() =>
      Promise.resolve({ payment_url: "https://pay.example/checkout" }),
    ),
    validateReferralCode: vi.fn(() => Promise.resolve({ valid: false })),
    requestAssistance: vi.fn(() =>
      Promise.resolve({
        reference_code: "FR-8K2M4P",
        billing_interval: "YEARLY",
        referral_code: "",
        phone: "01711111111",
        status: "NEW",
        whatsapp_url: "https://wa.me/8801712345678",
        created_at: "2026-08-13T10:00:00Z",
      }),
    ),
  };
  vi.mocked(usePaymentService).mockReturnValue(paymentService as never);
});

const renderBilling = () =>
  render(
    <MemoryRouter>
      <PaymentContentArea activeTab="payment" />
    </MemoryRouter>,
  );

describe("billing page while the gateway is up", () => {
  it("sends the user to the real checkout", async () => {
    renderBilling();

    const cta = await screen.findByRole("button", { name: /subscribe monthly/i });
    await userEvent.click(cta);

    expect(paymentService.initializePayment).toHaveBeenCalledWith(
      "MONTHLY",
      undefined,
    );
    expect(paymentService.requestAssistance).not.toHaveBeenCalled();
  });

  it("keeps checkout live when the fallback status check fails", async () => {
    paymentService.getFallbackStatus.mockRejectedValue(new Error("offline"));
    renderBilling();

    const cta = await screen.findByRole("button", { name: /subscribe monthly/i });
    await userEvent.click(cta);

    expect(paymentService.initializePayment).toHaveBeenCalled();
  });
});

describe("billing page while the fallback is enabled", () => {
  beforeEach(() => {
    paymentService.getFallbackStatus.mockResolvedValue(FALLBACK_ON);
  });

  it("shows the admin-authored apology instead of checkout", async () => {
    renderBilling();

    expect(await screen.findByText(FALLBACK_ON.headline)).toBeInTheDocument();
    expect(screen.getByText(FALLBACK_ON.message)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /subscribe monthly/i }),
    ).not.toBeInTheDocument();
  });

  it("still shows the prices, so users know what they're requesting", async () => {
    renderBilling();

    expect(await screen.findByText("৳350")).toBeInTheDocument();
    // Scholar's headline is the per-month figure; the 4-month total lives in a
    // "billed once for 4 months" note beside it.
    expect(screen.getByText("৳300")).toBeInTheDocument();
    expect(
      screen.getByText(/৳1,200 billed once for 4 months/),
    ).toBeInTheDocument();
  });

  it("never calls the payment gateway, whichever plan is picked", async () => {
    renderBilling();

    const ctas = await screen.findAllByRole("button", {
      name: /request paid access/i,
    });
    for (const cta of ctas) {
      await userEvent.click(cta);
    }

    expect(paymentService.initializePayment).not.toHaveBeenCalled();
  });

  it("submits a request for the chosen plan and shows the reference code", async () => {
    renderBilling();

    const [monthlyCta] = await screen.findAllByRole("button", {
      name: /request paid access/i,
    });
    await userEvent.click(monthlyCta);
    await userEvent.click(
      screen.getByRole("button", { name: /send request/i }),
    );

    await waitFor(() =>
      expect(paymentService.requestAssistance).toHaveBeenCalledWith("MONTHLY", {
        referral_code: undefined,
        phone: "01711111111",
      }),
    );
    expect(await screen.findByText("FR-8K2M4P")).toBeInTheDocument();
  });

  it("offers a WhatsApp link prefilled with the reference code", async () => {
    renderBilling();

    const [monthlyCta] = await screen.findAllByRole("button", {
      name: /request paid access/i,
    });
    await userEvent.click(monthlyCta);
    await userEvent.click(
      screen.getByRole("button", { name: /send request/i }),
    );

    const link = await screen.findByRole("link", {
      name: /message us on whatsapp/i,
    });
    expect(link).toHaveAttribute(
      "href",
      expect.stringContaining("https://wa.me/8801712345678?text="),
    );
    expect(decodeURIComponent(link.getAttribute("href") ?? "")).toContain(
      "FR-8K2M4P",
    );
  });

  it("hides the WhatsApp link when sales has no number configured", async () => {
    paymentService.getFallbackStatus.mockResolvedValue({
      ...FALLBACK_ON,
      whatsapp_url: "",
    });
    paymentService.requestAssistance.mockResolvedValue({
      reference_code: "FR-8K2M4P",
      billing_interval: "MONTHLY",
      referral_code: "",
      phone: "",
      status: "NEW",
      whatsapp_url: "",
      created_at: "2026-08-13T10:00:00Z",
    });
    renderBilling();

    const [monthlyCta] = await screen.findAllByRole("button", {
      name: /request paid access/i,
    });
    await userEvent.click(monthlyCta);
    await userEvent.click(
      screen.getByRole("button", { name: /send request/i }),
    );

    expect(await screen.findByText("FR-8K2M4P")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /message us on whatsapp/i }),
    ).not.toBeInTheDocument();
  });
});

describe("billing page when the gateway drops before the toggle is flipped", () => {
  it("falls back to the contact form on a 502 instead of dead-ending", async () => {
    paymentService.initializePayment.mockRejectedValue(gatewayDownError());
    renderBilling();

    await userEvent.click(
      await screen.findByRole("button", { name: /subscribe monthly/i }),
    );

    expect(await screen.findByText(FALLBACK_OFF.headline)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /send request/i }),
    ).toBeInTheDocument();
  });

  it("still shows a plain error for failures that aren't the gateway", async () => {
    paymentService.initializePayment.mockRejectedValue(
      Object.assign(new Error("Bad Request"), { response: { status: 400 } }),
    );
    renderBilling();

    await userEvent.click(
      await screen.findByRole("button", { name: /subscribe monthly/i }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /failed to initiate payment/i,
    );
    expect(screen.queryByText(FALLBACK_OFF.headline)).not.toBeInTheDocument();
  });
});
