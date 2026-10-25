"use client";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatEGP } from "@/lib/format";

export default function CartPage() {
  const { lines, subtotal, setQty, remove, ready } = useCart();

  if (!ready) return <div className="container-x py-20 text-center" role="status">جارٍ التحميل...</div>;

  if (lines.length === 0) {
    return (
      <div className="container-x py-20 text-center">
        <h1 className="font-display text-4xl">سلتك فارغة</h1>
        <p className="mt-3 text-forest/70">ابدئي باستكشاف منتجاتنا.</p>
        <Link href="/products" className="btn-primary mt-6">تسوقي الآن</Link>
      </div>
    );
  }

  return (
    <div className="container-x py-10">
      <h1 className="font-display text-4xl">سلة التسوق</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <ul className="space-y-4">
          {lines.map((l) => (
            <li key={`${l.productId}-${l.variant ?? ""}`} className="card flex gap-4 p-4">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-ivory-200">
                {l.image && <Image src={l.image} alt={l.name} fill sizes="96px" className="object-contain p-2" />}
              </div>
              <div className="flex-1">
                <Link href={`/products/${l.slug}`} className="font-medium">{l.name}</Link>
                {l.variant && <p className="text-xs text-forest/60">{l.variant}</p>}
                <p className="mt-1 text-sm">{formatEGP(l.price)}</p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex items-center rounded-full border border-sage" role="group" aria-label="الكمية">
                    <button aria-label="تقليل" className="h-9 w-9" onClick={() => setQty(l.productId, l.variant, l.quantity - 1)}>−</button>
                    <span className="w-8 text-center">{l.quantity}</span>
                    <button aria-label="زيادة" className="h-9 w-9" onClick={() => setQty(l.productId, l.variant, l.quantity + 1)}>+</button>
                  </div>
                  <button onClick={() => remove(l.productId, l.variant)} className="text-sm text-red-700 underline">حذف</button>
                </div>
              </div>
              <p className="font-semibold">{formatEGP(l.price * l.quantity)}</p>
            </li>
          ))}
        </ul>

        <aside className="card h-fit space-y-4 p-6">
          <h2 className="font-display text-2xl">ملخص الطلب</h2>
          <p className="flex justify-between"><span>المجموع الفرعي</span><span>{formatEGP(subtotal)}</span></p>
          <p className="text-xs text-forest/60">رسوم الشحن والخصومات تُحسب عند إتمام الطلب.</p>
          <Link href="/checkout" className="btn-primary w-full">إتمام الطلب</Link>
          <Link href="/products" className="block text-center text-sm underline">متابعة التسوق</Link>
        </aside>
      </div>
    </div>
  );
}
