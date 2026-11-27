import { studioApi } from "./api";

// Minimal typings for the slice of Razorpay Checkout we use.
type RazorpayHandlerResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};
type RazorpayOptions = {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  handler: (response: RazorpayHandlerResponse) => void;
  modal?: { ondismiss?: () => void };
};
type RazorpayInstance = { open: () => void };

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${RAZORPAY_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const s = document.createElement("script");
    s.src = RAZORPAY_SCRIPT;
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
}

export type CheckoutOutcome = "success" | "dismissed";

// Runs a full checkout: ask the API for an order, open the provider widget, verify on success.
// Provider-specific UI lives here (each gateway has its own widget); the API stays provider-agnostic.
// When we add another provider, branch on `info.provider` here.
export async function startPlanCheckout(plan: string): Promise<CheckoutOutcome> {
  const info = await studioApi.createCheckout(plan);
  if (info.provider !== "razorpay") {
    throw new Error("This payment method isn't supported in the web app yet.");
  }
  const loaded = await loadRazorpay();
  if (!loaded || !window.Razorpay) {
    throw new Error("Couldn't load the payment window. Check your connection and try again.");
  }

  return new Promise<CheckoutOutcome>((resolve, reject) => {
    const rz = new window.Razorpay!({
      key: info.keyId,
      order_id: info.orderId,
      amount: info.amountPaise,
      currency: info.currency,
      name: "TripSync",
      description: info.label,
      handler: (response) => {
        void studioApi
          .verifyPayment({ ...response })
          .then((res) => (res.ok ? resolve("success") : reject(new Error("Payment couldn't be confirmed."))))
          .catch(() => reject(new Error("Payment couldn't be confirmed.")));
      },
      modal: { ondismiss: () => resolve("dismissed") },
    });
    rz.open();
  });
}

// Owner-facing, AUTHENTICATED credit-aware group checkout, run from the Studio paywall. Applies the
// owner's referral credit: if it covers the whole fee the API unlocks immediately (no widget) and we
// resolve "success"; otherwise we open the provider widget for the remainder and verify as an authed
// payment. On dismiss we release the reserved credit via the cancel endpoint. Distinct from the public
// /pay rail (startGroupUnlockCheckout below).
export async function startAuthedGroupCheckout(tripId: string): Promise<CheckoutOutcome> {
  const result = await studioApi.createAuthedGroupCheckout(tripId);
  // Fully covered by credit — already unlocked server-side.
  if ("unlocked" in result) {
    return "success";
  }
  const info = result;
  if (info.provider !== "razorpay") {
    throw new Error("This payment method isn't supported in the web app yet.");
  }
  const loaded = await loadRazorpay();
  if (!loaded || !window.Razorpay) {
    throw new Error("Couldn't load the payment window. Check your connection and try again.");
  }

  return new Promise<CheckoutOutcome>((resolve, reject) => {
    const rz = new window.Razorpay!({
      key: info.keyId,
      order_id: info.orderId,
      amount: info.amountPaise,
      currency: info.currency,
      name: "TripSync",
      description: info.label,
      handler: (response) => {
        void studioApi
          .verifyPayment({ ...response })
          .then((res) => (res.ok ? resolve("success") : reject(new Error("Payment couldn't be confirmed."))))
          .catch(() => reject(new Error("Payment couldn't be confirmed.")));
      },
      modal: {
        ondismiss: () => {
          // Give the reserved credit back right away (the hourly sweep is the backstop).
          if (info.paymentId) {
            void studioApi.cancelAuthedGroupCheckout(tripId, info.paymentId).catch(() => undefined);
          }
          resolve("dismissed");
        },
      },
    });
    rz.open();
  });
}

// Public pay-to-unlock checkout, run from the /pay page by an UN-LOGGED-IN client. Unlike the plan
// checkout, there's no authed verify step — the provider webhook is the source of truth and unlocks
// the group server-side, so the page polls the public status endpoint after a "success" here. Resolves
// "success" when the widget reports the payment, "dismissed" if the client closes it.
export async function startGroupUnlockCheckout(payToken: string): Promise<CheckoutOutcome> {
  const info = await studioApi.createGroupCheckout(payToken);
  if (info.provider !== "razorpay") {
    throw new Error("This payment method isn't supported in the web app yet.");
  }
  const loaded = await loadRazorpay();
  if (!loaded || !window.Razorpay) {
    throw new Error("Couldn't load the payment window. Check your connection and try again.");
  }

  return new Promise<CheckoutOutcome>((resolve) => {
    const rz = new window.Razorpay!({
      key: info.keyId,
      order_id: info.orderId,
      amount: info.amountPaise,
      currency: info.currency,
      name: "TripSync",
      description: info.label,
      // No verify call (the payer isn't authenticated). The webhook unlocks the group; the page polls
      // status to confirm. We resolve "success" so the page starts polling immediately.
      handler: () => resolve("success"),
      modal: { ondismiss: () => resolve("dismissed") },
    });
    rz.open();
  });
}
