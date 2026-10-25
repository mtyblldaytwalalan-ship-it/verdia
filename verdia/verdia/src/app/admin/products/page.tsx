"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type P = {
  id?: string; slug: string; name_ar: string; description_ar: string; category_id: string;
  price_egp: string; compare_at_price_egp: string; stock: string; images: string[];
  variants: string; is_sample: boolean; is_active: boolean;
};
const empty: P = { slug: "", name_ar: "", description_ar: "", category_id: "", price_egp: "", compare_at_price_egp: "", stock: "0", images: [], variants: "[]", is_sample: false, is_active: true };

export default function AdminProducts() {
  const sb = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<any[]>([]);
  const [cats, setCats] = useState<{ id: string; name_ar: string }[]>([]);
  const [form, setForm] = useState<P | null>(null);
  const [msg, setMsg] = useState<{ type: "error" | "ok"; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    const [p, c] = await Promise.all([sb.from("products").select("*").order("created_at", { ascending: false }), sb.from("categories").select("id,name_ar").order("sort_order")]);
    if (p.error) setMsg({ type: "error", text: "تعذر تحميل المنتجات." });
    setRows(p.data ?? []); setCats(c.data ?? []);
  }, [sb]);
  useEffect(() => { load(); }, [load]);

  const edit = (r: any) => setForm({
    id: r.id, slug: r.slug, name_ar: r.name_ar, description_ar: r.description_ar ?? "", category_id: r.category_id ?? "",
    price_egp: String(r.price_egp), compare_at_price_egp: r.compare_at_price_egp ? String(r.compare_at_price_egp) : "",
    stock: String(r.stock), images: r.images ?? [], variants: JSON.stringify(r.variants ?? []), is_sample: r.is_sample, is_active: r.is_active,
  });

  const upload = async (files: FileList | null) => {
    if (!files?.length || !form) return;
    setUploading(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) { setMsg({ type: "error", text: "الملف يجب أن يكون صورة بحجم أقل من 5 ميجابايت." }); continue; }
      const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await sb.storage.from("product-images").upload(path, file, { contentType: file.type });
      if (error) { setMsg({ type: "error", text: "فشل رفع الصورة. تأكدي من صلاحيات المسؤول." }); continue; }
      urls.push(sb.storage.from("product-images").getPublicUrl(path).data.publicUrl);
    }
    setForm({ ...form, images: [...form.images, ...urls] });
    setUploading(false);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    let variants: unknown;
    try { variants = JSON.parse(form.variants || "[]"); if (!Array.isArray(variants)) throw 0; } catch { return setMsg({ type: "error", text: "صيغة الخيارات غير صحيحة (JSON)." }); }
    const price = Number(form.price_egp), compare = form.compare_at_price_egp ? Number(form.compare_at_price_egp) : null, stock = Number(form.stock);
    if (!form.name_ar.trim() || !/^[a-z0-9-]+$/.test(form.slug)) return setMsg({ type: "error", text: "الاسم مطلوب، والرابط بحروف إنجليزية صغيرة وأرقام وشرطات فقط." });
    if (!(price >= 0) || !Number.isInteger(stock) || stock < 0) return setMsg({ type: "error", text: "السعر أو المخزون غير صحيح." });
    if (compare !== null && compare < price) return setMsg({ type: "error", text: "السعر السابق يجب أن يكون أكبر من أو يساوي السعر الحالي." });
    const payload = {
      slug: form.slug, name_ar: form.name_ar.trim(), description_ar: form.description_ar || null, category_id: form.category_id || null,
      price_egp: price, compare_at_price_egp: compare, stock, images: form.images, variants, is_sample: form.is_sample, is_active: form.is_active,
    };
    const res = form.id ? await sb.from("products").update(payload).eq("id", form.id) : await sb.from("products").insert(payload);
    if (res.error) return setMsg({ type: "error", text: res.error.code === "23505" ? "هذا الرابط مستخدم لمنتج آخر." : "تعذر الحفظ." });
    setMsg({ type: "ok", text: "تم الحفظ." }); setForm(null); load();
  };

  const del = async (id: string) => {
    if (!confirm("حذف المنتج نهائيًا؟ (يمكنك بدلًا من ذلك إيقافه من التعديل)")) return;
    const { error } = await sb.from("products").delete().eq("id", id);
    setMsg(error ? { type: "error", text: "تعذر الحذف." } : { type: "ok", text: "تم الحذف." }); load();
  };

  const set = <K extends keyof P>(k: K, v: P[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));

  return (
    <div>
      <div className="flex items-center justify-between"><h1 className="font-display text-3xl">المنتجات</h1><button className="btn-primary" onClick={() => { setForm(empty); setMsg(null); }}>+ منتج جديد</button></div>
      {msg && <p role={msg.type === "error" ? "alert" : "status"} className={`mt-4 rounded-xl p-3 text-sm ${msg.type === "error" ? "bg-red-50 text-red-800" : "bg-sage-200"}`}>{msg.text}</p>}

      {form && (
        <form onSubmit={save} className="card mt-6 grid gap-4 p-6 md:grid-cols-2">
          <div><label className="label" htmlFor="n">الاسم *</label><input id="n" className="input" value={form.name_ar} onChange={(e) => set("name_ar", e.target.value)} /></div>
          <div><label className="label" htmlFor="s">الرابط (slug) *</label><input id="s" dir="ltr" className="input" value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="my-product" /></div>
          <div><label className="label" htmlFor="c">التصنيف</label><select id="c" className="input" value={form.category_id} onChange={(e) => set("category_id", e.target.value)}><option value="">—</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name_ar}</option>)}</select></div>
          <div><label className="label" htmlFor="st">المخزون</label><input id="st" type="number" min="0" className="input" value={form.stock} onChange={(e) => set("stock", e.target.value)} /></div>
          <div><label className="label" htmlFor="pr">السعر (ج.م) *</label><input id="pr" type="number" min="0" step="0.01" className="input" value={form.price_egp} onChange={(e) => set("price_egp", e.target.value)} /></div>
          <div><label className="label" htmlFor="cp">السعر السابق (اختياري)</label><input id="cp" type="number" min="0" step="0.01" className="input" value={form.compare_at_price_egp} onChange={(e) => set("compare_at_price_egp", e.target.value)} /></div>
          <div className="md:col-span-2"><label className="label" htmlFor="d">الوصف</label><textarea id="d" rows={4} className="input" value={form.description_ar} onChange={(e) => set("description_ar", e.target.value)} /></div>
          <div className="md:col-span-2">
            <label className="label" htmlFor="v">الخيارات (JSON) — مثال: [{`{"name":"الحجم","options":["50 مل","100 مل"]}`}]</label>
            <textarea id="v" dir="ltr" rows={2} className="input font-mono text-xs" value={form.variants} onChange={(e) => set("variants", e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="label" htmlFor="img">الصور</label>
            <input id="img" type="file" accept="image/*" multiple onChange={(e) => upload(e.target.files)} />
            {uploading && <p role="status" className="text-xs">جارٍ الرفع...</p>}
            <ul className="mt-2 flex flex-wrap gap-2">
              {form.images.map((u) => (
                <li key={u} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={u} alt="" className="h-20 w-20 rounded-lg object-contain bg-ivory-200" />
                  <button type="button" aria-label="حذف الصورة" onClick={() => set("images", form.images.filter((x) => x !== u))} className="absolute -top-2 -start-2 h-6 w-6 rounded-full bg-red-700 text-xs text-white">×</button>
                </li>
              ))}
            </ul>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={(e) => set("is_active", e.target.checked)} /> ظاهر في المتجر</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_sample} onChange={(e) => set("is_sample", e.target.checked)} /> بيانات تجريبية (تظهر بعلامة «عينة»)</label>
          <div className="flex gap-2 md:col-span-2"><button className="btn-primary" disabled={uploading}>حفظ</button><button type="button" className="btn-outline" onClick={() => setForm(null)}>إلغاء</button></div>
        </form>
      )}

      <div className="card mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-ivory-200"><tr>{["الاسم", "السعر", "المخزون", "الحالة", ""].map((h) => <th key={h} className="p-3 text-start font-semibold">{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-beige">
                <td className="p-3">{r.name_ar}{r.is_sample && <span className="ms-2 rounded-full bg-gold/80 px-2 text-[10px]">عينة</span>}</td>
                <td className="p-3">{r.price_egp}</td><td className="p-3">{r.stock}</td><td className="p-3">{r.is_active ? "ظاهر" : "مخفي"}</td>
                <td className="whitespace-nowrap p-3 text-end"><button className="me-3 underline" onClick={() => edit(r)}>تعديل</button><button className="text-red-700 underline" onClick={() => del(r.id)}>حذف</button></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="p-6 text-forest/60">لا توجد منتجات.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
