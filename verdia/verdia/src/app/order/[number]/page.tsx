import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatEGP } from "@/lib/format";

export const metadata = { title: "تأكيد الطلب", robots: { index: false } };

const STATUS: Record<string, string> = { pending: "قيد المراجعة", confirmed: "تم التأكيد", shipped: "تم الشحن", delivered: "تم التسليم", cancelled: "ملغي" };

export default async function OrderPage({ params, searchParams }: { params: Promise<{ number: string }>; searchParams: Promise<{ phone?: string }> }) {
  const { number } = await params;
  const { phone } = await searchParams;
  if (!phone) notFound();
  const sb = await createClient();
  // Lookup requires both order number and the phone used at checkout.
  const { data } = await sb.rpc("get_order", { p_number: number, p_phone: phone });
  if (!data) notFound();
  const { order: o, items } = data as { order: Record<string, any>; items: { name_ar: string; quantity: number; unit_price_egp: number; variant: string | null }[] };

  return (
    <div className="container-x py-14">
      <div className="card mx-auto max-w-2xl p-8">
        <h1 className="font-display text-4xl text-center">شكرًا لطلبك!</h1>
        <p className="mt-3 text-center">رقم الطلب: <strong dir="ltr">{o.order_number}</strong></p>
        <p className="text-center text-sm text-forest/70">الحالة: {STATUS[o.status] ?? o.status} — الدفع عند الاستلام</p>
        <ul className="mt-6 space-y-2 text-sm">
          {items.map((i, k) => <li key={k} className="flex justify-between"><span>{i.name_ar}{i.variant ? ` (${i.variant})` : ""} × {i.quantity}</span><span>{formatEGP(i.unit_price_egp * i.quantity)}</span></li>)}
        </ul>
        <div className="mt-4 space-y-1 border-t border-beige pt-4 text-sm">
          <p className="flex justify-between"><span>المجموع الفرعي</span><span>{formatEGP(o.subtotal_egp)}</span></p>
          {Number(o.discount_egp) > 0 && <p className="flex justify-between"><span>الخصم</span><span>− {formatEGP(o.discount_egp)}</span></p>}
          <p className="flex justify-between"><span>الشحن</span><span>{Number(o.shipping_egp) === 0 ? "مجاني" : formatEGP(o.shipping_egp)}</span></p>
          <p className="flex justify-between text-lg font-bold"><span>الإجمالي</span><span>{formatEGP(o.total_egp)}</span></p>
        </div>
        <p className="mt-4 text-sm text-forest/70">التوصيل إلى: {o.address_line}، {o.city}، {o.governorate}</p>
        <div className="mt-6 text-center"><Link href="/products" className="btn-primary">متابعة التسوق</Link></div>
      </div>
    </div>
  );
}
