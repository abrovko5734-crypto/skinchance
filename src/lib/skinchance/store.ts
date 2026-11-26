import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SKIN_BY_ID, type Skin } from "@/data/catalog";
import { floatFor } from "@/lib/skinchance/game";
import { normalizeTradeUrl } from "@/lib/skinchance/money";

export interface InvItem {
  uid: string;
  itemId: string;
  float: number;
  at: number;
}

export interface Withdrawal {
  id: string;
  at: number;
  tradeUrl: string;
  items: { name: string; price: number }[];
  total: number;
  status: "processing";
}

export interface LogRow {
  id: string;
  at: number;
  text: string;
}

interface State {
  balance: number;
  inventory: InvItem[];
  profileName: string;
  tradeUrl: string;
  soundOn: boolean;
  withdrawals: Withdrawal[];
  log: LogRow[];
  deposit: (cents: number) => void;
  spend: (cents: number) => boolean;
  addSkin: (itemId: string) => string;
  remove: (uids: string[]) => void;
  sell: (uids: string[]) => number;
  setName: (name: string) => void;
  setTradeUrl: (raw: string) => string | null;
  withdraw: (uids: string[]) => string | null;
  pushLog: (text: string) => void;
  setSound: (on: boolean) => void;
}

const uid = () => {
  const buf = new Uint32Array(2);
  crypto.getRandomValues(buf);
  return Array.from(buf, (n) => n.toString(36)).join("");
};

export const useGame = create<State>()(
  persist(
    (set, get) => ({
      balance: 0,
      inventory: [],
      profileName: "Игрок",
      tradeUrl: "",
      soundOn: true,
      withdrawals: [],
      log: [],
      deposit: (cents) => {
        if (cents <= 0) return;
        set((s) => ({ balance: s.balance + Math.round(cents) }));
      },
      spend: (cents) => {
        const need = Math.round(cents);
        if (get().balance < need) return false;
        set((s) => ({ balance: s.balance - need }));
        return true;
      },
      addSkin: (itemId) => {
        const skin = SKIN_BY_ID[itemId];
        const id = uid();
        if (!skin) return id;
        const row: InvItem = { uid: id, itemId, float: floatFor(skin.wear), at: Date.now() };
        set((s) => ({ inventory: [row, ...s.inventory] }));
        return id;
      },
      remove: (uids) => {
        const drop = new Set(uids);
        set((s) => ({ inventory: s.inventory.filter((i) => !drop.has(i.uid)) }));
      },
      sell: (uids) => {
        const drop = new Set(uids);
        const rows = get().inventory.filter((i) => drop.has(i.uid));
        const total = rows.reduce((sum, row) => sum + (SKIN_BY_ID[row.itemId]?.price ?? 0), 0);
        set((s) => ({
          inventory: s.inventory.filter((i) => !drop.has(i.uid)),
          balance: s.balance + total,
        }));
        return total;
      },
      setName: (name) => set({ profileName: name.trim().slice(0, 24) || "Игрок" }),
      setTradeUrl: (raw) => {
        const next = normalizeTradeUrl(raw);
        if (!next) return null;
        set({ tradeUrl: next });
        return next;
      },
      withdraw: (uids) => {
        const trade = get().tradeUrl;
        if (!normalizeTradeUrl(trade)) return "Сначала сохраните трейд-ссылку Steam";
        const drop = new Set(uids);
        const rows = get().inventory.filter((i) => drop.has(i.uid));
        if (!rows.length) return "Выберите хотя бы один скин";
        const items = rows.map((row) => {
          const skin = SKIN_BY_ID[row.itemId];
          return { name: skin?.marketHash ?? row.itemId, price: skin?.price ?? 0 };
        });
        const total = items.reduce((s, i) => s + i.price, 0);
        const request: Withdrawal = {
          id: uid(),
          at: Date.now(),
          tradeUrl: trade,
          items,
          total,
          status: "processing",
        };
        set((s) => ({
          inventory: s.inventory.filter((i) => !drop.has(i.uid)),
          withdrawals: [request, ...s.withdrawals].slice(0, 30),
        }));
        get().pushLog(`Вывод ${items.length} скин. на трейд-ссылку`);
        return null;
      },
      pushLog: (text) =>
        set((s) => ({ log: [{ id: uid(), at: Date.now(), text }, ...s.log].slice(0, 40) })),
      setSound: (on) => set({ soundOn: on }),
    }),
    { name: "skinchance-v1" },
  ),
);

export function skinOf(row: { itemId: string }): Skin | undefined {
  return SKIN_BY_ID[row.itemId];
}
