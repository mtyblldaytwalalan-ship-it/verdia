"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/lib/types";
import { useCart } from "@/lib/cart";
import { discountPercent, formatEGP } from "@/lib/format";

export default function ProductCard({ p, rating }: { p: Product; rating?: { avg: number; n: number } }) {
  const { add, wishlist, toggleWish } = useCart();
  const [quick, setQuick] = useState(false);
  const [added, setAdded] = useState(false);
  const off = discountPercent(p.price_egp, p.compare_at_price_egp);
  const wished = wishlist.includes(p.id);
  const out = p.stock < 1;
  const hasVariants = p.variants.length > 0;

  const addToCart = () => {
    add({ productId: p.id, slug: p.slug, name: p.name_ar, price: p.price_egp, image: p.images[0] });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <article className="card group relative flex flex-col p-3 transition hover:-translate-y-1">
      <div className="absolute top-3 start-3 z-10 flex flex-col gap-1">
        {off > 0 && <span className="rounded-full bg-forest px-2 py-0.5 text-[11px] text-ivory">خصم {off}%</span>}
        {p.is_sample && <span className="rounded-full bg-gold/90 px-2 py-0.5 text-[11px] text-forest">عينة</span>}
      </div>
      <button onClick={() => toggleWish(p.id)} aria-pressed={wished} aria-label={wished ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
        className="absolute top-3 end-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-lg shadow">
        <span className={wished ? "text-red-600" : "text-forest/60"}>{wished ? "♥" : "♡"}</span>
      </button>

      <Link href={`/products/${p.slug}`} className="relative block aspect-square overflow-hidden rounded-xl bg-ivory-200">
        {p.images[0]
          ? <Image src={p.images[0]} alt={p.name_ar} fill sizes="(max-width:768px) 50vw, 25vw" className="object-contain p-4 transition duration-500 group-hover:scale-105" />
          : <div className="grid h-full place-items-center text-sm text-forest/40">لا توجد صورة</div>}
      </Link>

      <div className="flex flex-1 flex-col gap-2 pt-3 text-center">
        <Link href={`/products/${p.slug}`} className="line-clamp-2 min-h-12 text-sm font-medium">{p.name_ar}</Link>
        {rating && rating.n > 0 && (
          <p className="text-xs text-gold" aria-label={`التقييم ${rating.avg.toFixed(1)} من 5`}>
            {"★".repeat(Math.round(rating.avg))}{"☆".repeat(5 - Math.round(rating.avg))} <span className="text-forest/60">({rating.n})</span>
          </p>
        )}
        <p className="font-semibold">
          {formatEGP(p.price_egp)}
          {p.compare_at_price_egp && off > 0 && <span className="ms-2 text-xs font-normal text-forest/50 line-through">{formatEGP(p.compare_at_price_egp)}</span>}
        </p>
        <p className={`text-xs ${out ? "text-red-700" : p.stock <= 5 ? "text-gold-600" : "text-forest-700"}`}>
          {out ? "غير متوفر" : p.stock <= 5 ? `متبقي ${p.stock} فقط` : "متوفر"}
        </p>
        <div className="mt-auto flex gap-2">
          {hasVariants
            ? <Link href={`/products/${p.slug}`} className="btn-primary flex-1 !py-2">اختيار الخيارات</Link>
            : <button onClick={addToCart} disabled={out} className="btn-primary flex-1 !py-2">{out ? "نفدت الكمية" : added ? "✓ تمت الإضافة" : "أضف إلى السلة"}</button>}
          <button onClick={() => setQuick(true)} aria-label="نظرة سريعة" className="btn-outline !px-3 !py-2">👁</button>
        </div>
      </div>

      {quick && (
        <div role="dialog" aria-modal="true" aria-label={p.name_ar} className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setQuick(false)}>
          <div className="card max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-2xl">{p.name_ar}</h3>
            <p className="mt-3 text-sm text-forest/80">{p.description_ar || "لا يوجد وصف بعد."}</p>
            <p className="mt-3 font-semibold">{formatEGP(p.price_egp)}</p>
            <div className="mt-5 flex gap-2">
              <Link href={`/products/${p.slug}`} className="btn-primary">عرض المنتج</Link>
              <button onClick={() => setQuick(false)} className="btn-outline">إغلاق</button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
