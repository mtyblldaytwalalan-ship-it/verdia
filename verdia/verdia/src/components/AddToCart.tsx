"use client";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import type { Product } from "@/lib/types";

export default function AddToCart({ product: p }: { product: Product }) {
  const { add, wishlist, toggleWish } = useCart();
  const [qty, setQty] = useState(1);
  const [choice, setChoice] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const out = p.stock < 1;
  const wished = wishlist.includes(p.id);

  const submit = () => {
    const missing = p.variants.find((v) => !choice[v.name]);
    if (missing) { setErr(`يرجى اختيار ${missing.name}`); return; }
    setErr("");
    const variant = p.variants.length ? p.variants.map((v) => `${v.name}: ${choice[v.name]}`).join("، ") : undefined;
    add({ productId: p.id, slug: p.slug, name: p.name_ar, price: p.price_egp, image: p.images[0], variant }, qty);
    setDone(true);
  };

  return (
    <div className="mt-6 space-y-5">
      {p.variants.map((v) => (
        <fieldset key={v.name}>
          <legend className="label">{v.name}</legend>
          <div className="flex flex-wrap gap-2">
            {v.options.map((o) => (
              <button key={o} type="button" aria-pressed={choice[v.name] === o} onClick={() => setChoice({ ...choice, [v.name]: o })}
                className={`rounded-full border px-4 py-1.5 text-sm ${choice[v.name] === o ? "border-forest bg-forest text-ivory" : "border-sage"}`}>{o}</button>
            ))}
          </div>
        </fieldset>
      ))}

      <p className={`text-sm ${out ? "text-red-700" : "text-forest-700"}`}>{out ? "غير متوفر حاليًا" : p.stock <= 5 ? `متبقي ${p.stock} فقط` : "متوفر في المخزون"}</p>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-full border border-sage" role="group" aria-label="الكمية">
          <button type="button" aria-label="تقليل" className="h-11 w-11" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
          <span className="w-8 text-center" aria-live="polite">{qty}</span>
          <button type="button" aria-label="زيادة" className="h-11 w-11" onClick={() => setQty(Math.min(p.stock, qty + 1))} disabled={qty >= p.stock}>+</button>
        </div>
        <button onClick={submit} disabled={out} className="btn-primary flex-1 sm:flex-none">{out ? "نفدت الكمية" : "أضف إلى السلة"}</button>
        <button onClick={() => toggleWish(p.id)} aria-pressed={wished} className="btn-outline">{wished ? "♥ في المفضلة" : "♡ المفضلة"}</button>
      </div>
      {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
      {done && <p role="status" className="text-sm text-forest-700">تمت الإضافة إلى السلة. <Link href="/cart" className="underline">عرض السلة</Link></p>}
    </div>
  );
}
