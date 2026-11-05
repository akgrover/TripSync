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
