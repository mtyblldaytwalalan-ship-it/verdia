"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatEGP } from "@/lib/format";

const STATUSES: [string, string][] = [["pending", "قيد المراجعة"], ["confirmed", "تم التأكيد"], ["shipped", "تم الشحن"], ["delivered", "تم التسليم"], ["cancelled", "ملغي"]];

export default function AdminOrders() {
  const sb = useMemo(() => createClient(), []);
  const [orders, setOrders] = useState<any[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [msg, setMsg] = useState<{ type: "error" | "ok"; text: string } | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await sb.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }).limit(200);
    if (error) setMsg({ type: "error", text: "تعذر تحميل الطلبات." });
    setOrders(data ?? []);
  }, [sb]);
  useEffect(() => { load(); }, [load]);

  const setStatus = async (o: any, status: string) => {
    const { error } = await sb.from("orders").update({ status }).eq("id", o.id);
    if (error) return setMsg({ type: "error", text: "تعذر تحديث الحالة." });
    // Stock is returned by the restock_on_cancel database trigger (003_restock.sql).
    setMsg({ type: "ok", text: "تم تحديث الحالة." }); load();
  };

  const shown = orders.filter((o) => !filter || o.status === filter);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl">الطلبات</h1>
        <select aria-label="تصفية بالحالة" className="input !w-auto" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">كل الحالات</option>{STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      {msg && <p role={msg.type === "error" ? "alert" : "status"} className={`mt-4 rounded-xl p-3 text-sm ${msg.type === "error" ? "bg-red-50 text-red-800" : "bg-sage-200"}`}>{msg.text}</p>}
      <ul className="mt-6 space-y-3">
        {shown.length === 0 && <li className="card p-6 text-forest/60">لا توجد طلبات.</li>}
        {shown.map((o) => (
          <li key={o.id} className="card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button onClick={() => setOpen(open === o.id ? null : o.id)} className="font-semibold underline" dir="ltr" aria-expanded={open === o.id}>{o.order_number}</button>
              <span className="text-sm">{o.customer_name}</span>
              <span className="text-sm">{new Date(o.created_at).toLocaleString("ar-EG")}</span>
              <span className="font-semibold">{formatEGP(o.total_egp)}</span>
              <select aria-label="حالة الطلب" className="input !w-auto !py-1" value={o.status} onChange={(e) => setStatus(o, e.target.value)}>
                {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            {open === o.id && (
              <div className="mt-4 grid gap-4 border-t border-beige pt-4 text-sm md:grid-cols-2">
                <div>
                  <p>الهاتف: <span dir="ltr">{o.phone}</span></p>
                  <p>العنوان: {o.address_line}، {o.city}، {o.governorate}</p>
                  {o.notes && <p>ملاحظات: {o.notes}</p>}
                  <p>الدفع: عند الاستلام{o.promo_code ? ` — كود: ${o.promo_code}` : ""}</p>
                </div>
                <ul>
                  {o.order_items.map((i: any) => <li key={i.id}>{i.name_ar}{i.variant ? ` (${i.variant})` : ""} × {i.quantity} — {formatEGP(i.unit_price_egp * i.quantity)}</li>)}
                  <li className="mt-2 text-forest/70">شحن {formatEGP(o.shipping_egp)} · خصم {formatEGP(o.discount_egp)}</li>
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
