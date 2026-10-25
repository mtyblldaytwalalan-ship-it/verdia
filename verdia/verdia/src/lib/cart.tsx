"use client";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CartLine } from "./types";

type CartCtx = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  add: (l: Omit<CartLine, "quantity">, qty?: number) => void;
  setQty: (productId: string, variant: string | undefined, qty: number) => void;
  remove: (productId: string, variant?: string) => void;
  clear: () => void;
  wishlist: string[];
  toggleWish: (productId: string) => void;
  ready: boolean;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "verdia-cart-v1";
const WKEY = "verdia-wishlist-v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setLines(JSON.parse(localStorage.getItem(KEY) ?? "[]"));
      setWishlist(JSON.parse(localStorage.getItem(WKEY) ?? "[]"));
    } catch { /* ignore corrupt storage */ }
    setReady(true);
  }, []);
  useEffect(() => { if (ready) try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch {} }, [lines, ready]);
  useEffect(() => { if (ready) try { localStorage.setItem(WKEY, JSON.stringify(wishlist)); } catch {} }, [wishlist, ready]);

  const same = (l: CartLine, id: string, v?: string) => l.productId === id && l.variant === v;

  const value = useMemo<CartCtx>(() => ({
    lines, ready, wishlist,
    count: lines.reduce((s, l) => s + l.quantity, 0),
    subtotal: lines.reduce((s, l) => s + l.price * l.quantity, 0),
    add: (l, qty = 1) => setLines((p) => {
      const i = p.findIndex((x) => same(x, l.productId, l.variant));
      if (i === -1) return [...p, { ...l, quantity: qty }];
      return p.map((x, j) => (j === i ? { ...x, quantity: x.quantity + qty } : x));
    }),
    setQty: (id, v, qty) => setLines((p) => qty < 1 ? p.filter((x) => !same(x, id, v)) : p.map((x) => same(x, id, v) ? { ...x, quantity: qty } : x)),
    remove: (id, v) => setLines((p) => p.filter((x) => !same(x, id, v))),
    clear: () => setLines([]),
    toggleWish: (id) => setWishlist((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]),
  }), [lines, wishlist, ready]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useCart = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
};
