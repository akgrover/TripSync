// Format a paise amount as Indian rupees for display (e.g. 299900 → "₹2,999"). Whole rupees only —
// our prices are round amounts. Shared by the plan section, the group paywall, and the pay page.
export function formatRupees(paise: number): string {
  return `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;
}
