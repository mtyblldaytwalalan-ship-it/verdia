"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/lib/cart";
import { createClient } from "@/lib/supabase/client";
import { EGYPT_PHONE, formatEGP } from "@/lib/format";
import type { ShippingRule } from "@/lib/types";

type Errors = Partial<Record<"name" | "phone" | "governorate" | "city" | "address", string>>;

export default function CheckoutPage() {
  const { lines, subtotal, clear, ready } = useCart();
  const router = useRouter();
  const sb = useMemo(() => createClient(), []);
  const [rules, setRules] = useState<ShippingRule[]>([]);
  const [rulesError, setRulesError] = useState(false);
  const [f, setF] = useState({ name: "", phone: "", governorate: "", city: "", address: "", notes: "", promo: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    sb.from("shipping_rules").select("*").eq("is_serviceable", true).order("governorate").then(({ data, error }) => {
      if (error) setRulesError(true); else setRules((data ?? []) as ShippingRule[]);
    });
  }, [sb]);

  const rule = rules.find((r) => r.governorate === f.governorate);
  const shipping = rule ? (rule.free_over_egp != null && subtotal >= rule.free_over_egp ? 0 : Number(rule.fee_egp)) : null;
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const validate = (): Errors => {
    const e: Errors = {};
    if (f.name.trim().length < 2) e.name = "يرجى إدخال الاسم بالكامل.";
    if (!EGYPT_PHONE.test(f.phone)) e.phone = "أدخلي رقم موبايل مصري صحيحًا (مثال: 01012345678).";
    if (!f.governorate) e.governorate = "يرجى اختيار المحافظة.";
    if (f.city.trim().length < 2) e.city = "يرجى إدخال المدينة أو المنطقة.";
    if (f.address.trim().length < 8) e.address = "يرجى كتابة العنوان بالتفصيل.";
    return e;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setServerError("");
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setSubmitting(true);
    const { data, error } = await sb.rpc("create_order", {
      p_items: lines.map((l) => ({ product_id: l.productId, quantity: l.quantity, variant: l.variant ?? null })),
      p_name: f.name, p_phone: f.phone, p_governorate: f.governorate, p_city: f.city,
      p_address: f.address, p_notes: f.notes || null, p_promo: f.promo || null,
    });
    setSubmitting(false);
    // Never show success unless the database actually created the order.
    const row = Array.isArray(data) ? data[0] : null;
    if (error || !row?.order_number) {
      setServerError(error?.message && /[؀-ۿ]/.test(error.message) ? error.message : "تعذر إنشاء الطلب. لم يتم خصم أي مبلغ. حاولي مرة أخرى.");
      return;
    }
    clear();
    router.push(`/order/${row.order_number}?phone=${encodeURIComponent(f.phone)}`);
  };

  if (!ready) return <div className="container-x py-20 text-center" role="status">جارٍ التحميل...</div>;
  if (lines.length === 0) return (
    <div className="container-x py-20 text-center"><h1 className="font-display text-4xl">لا توجد منتجات في السلة</h1><Link href="/products" className="btn-primary mt-6">تسوقي الآن</Link></div>
  );

  const field = (id: keyof Errors, label: string, el: React.ReactNode) => (
    <div><label className="label" htmlFor={id}>{label}</label>{el}{errors[id] && <p role="alert" className="mt-1 text-xs text-red-700">{errors[id]}</p>}</div>
  );

  return (
    <div className="container-x py-10">
      <h1 className="font-display text-4xl">إتمام الطلب</h1>
      <form onSubmit={submit} noValidate className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="card space-y-4 p-6">
          <h2 className="font-display text-2xl">بيانات التوصيل</h2>
          {field("name", "الاسم بالكامل", <input id="name" className="input" value={f.name} onChange={set("name")} autoComplete="name" />)}
          {field("phone", "رقم الموبايل", <input id="phone" dir="ltr" inputMode="tel" className="input text-end" value={f.phone} onChange={set("phone")} autoComplete="tel" placeholder="01XXXXXXXXX" />)}
          <div className="grid gap-4 sm:grid-cols-2">
            {field("governorate", "المحافظة", (
              <select id="governorate" className="input" value={f.governorate} onChange={set("governorate")}>
                <option value="">اختاري المحافظة</option>
                {rules.map((r) => <option key={r.governorate}>{r.governorate}</option>)}
              </select>
            ))}
            {field("city", "المدينة / المنطقة", <input id="city" className="input" value={f.city} onChange={set("city")} />)}
          </div>
          {rulesError && <p role="alert" className="text-sm text-red-700">تعذر تحميل المحافظات. حدّثي الصفحة.</p>}
          {field("address", "العنوان بالتفصيل", <textarea id="address" rows={3} className="input" value={f.address} onChange={set("address")} autoComplete="street-address" />)}
          <div><label className="label" htmlFor="notes">ملاحظات التوصيل (اختياري)</label><textarea id="notes" rows={2} className="input" value={f.notes} onChange={set("notes")} /></div>
          <div><label className="label" htmlFor="promo">كود الخصم (اختياري)</label><input id="promo" dir="ltr" className="input text-end" value={f.promo} onChange={set("promo")} /><p className="mt-1 text-xs text-forest/60">يتم التحقق من الكود عند تأكيد الطلب.</p></div>
          <div className="rounded-xl border border-sage bg-ivory-200 p-4 text-sm"><strong>طريقة الدفع:</strong> الدفع عند الاستلام</div>
        </div>

        <aside className="card h-fit space-y-3 p-6">
          <h2 className="font-display text-2xl">ملخص الطلب</h2>
          <ul className="space-y-1 text-sm">
            {lines.map((l) => <li key={`${l.productId}-${l.variant ?? ""}`} className="flex justify-between gap-2"><span>{l.name} × {l.quantity}</span><span>{formatEGP(l.price * l.quantity)}</span></li>)}
          </ul>
          <hr className="border-beige" />
          <p className="flex justify-between"><span>المجموع الفرعي</span><span>{formatEGP(subtotal)}</span></p>
          <p className="flex justify-between"><span>الشحن</span><span>{shipping == null ? "اختاري المحافظة" : shipping === 0 ? "مجاني" : formatEGP(shipping)}</span></p>
          <p className="flex justify-between border-t border-beige pt-3 text-lg font-bold"><span>الإجمالي</span><span>{formatEGP(subtotal + (shipping ?? 0))}</span></p>
          <p className="text-xs text-forest/60">الأسعار والمخزون والخصومات والشحن تُؤكَّد نهائيًا من الخادم عند إرسال الطلب.</p>
          {serverError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{serverError}</p>}
          <button className="btn-primary w-full" disabled={submitting}>{submitting ? "جارٍ إرسال الطلب..." : "تأكيد الطلب"}</button>
        </aside>
      </form>
    </div>
  );
}
