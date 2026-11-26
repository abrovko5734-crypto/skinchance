import { UAH_PER_DP } from "@/data/catalog";

/** Price is integer cents of DP. 100 cents = 1 DP = 0.50 UAH exactly. */
export function formatDp(cents: number): string {
  return (cents / 100).toLocaleString("uk-UA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatUah(cents: number): string {
  const uah = (cents / 100) * UAH_PER_DP;
  return uah.toLocaleString("uk-UA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function dpLabel(cents: number): string {
  return `${formatDp(cents)} DP`;
}

export const TRADE_HINT = "https://steamcommunity.com/tradeoffer/new/?partner=000&token=XXXXXXXX";

export function normalizeTradeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.hostname !== "steamcommunity.com") return null;
  const path = url.pathname.replace(/\/+$/, "");
  if (path !== "/tradeoffer/new") return null;
  const partner = url.searchParams.get("partner") ?? "";
  const token = url.searchParams.get("token") ?? "";
  if (!/^\d{2,20}$/.test(partner)) return null;
  if (!/^[A-Za-z0-9_-]{6,16}$/.test(token)) return null;
  return `https://steamcommunity.com/tradeoffer/new/?partner=${partner}&token=${token}`;
}
