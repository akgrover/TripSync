// Format a paise amount as Indian rupees for display (e.g. 299900 → "₹2,999"). Whole rupees only —
// our prices are round amounts. Shared by the plan section, the group paywall, and the pay page.
export function formatRupees(paise: number): string {
  return `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;
}

// Like formatRupees but keeps paise when the amount isn't a whole rupee (e.g. referral credit of
// 9999 paise → "₹99.99"). Used for the Refer & Earn wallet, where rounding would misstate a balance.
export function formatRupeesPrecise(paise: number): string {
  const rupees = paise / 100;
  const whole = Number.isInteger(rupees);
  return `₹${rupees.toLocaleString("en-IN", {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}
