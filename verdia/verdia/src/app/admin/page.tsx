import { createClient } from "@/lib/supabase/server";
import { formatEGP } from "@/lib/format";

export default async function Dashboard() {
  const sb = await createClient();
  const [{ data: orders }, { count: products }, { data: low }] = await Promise.all([
    sb.from("orders").select("status,total_egp,created_at"),
    sb.from("products").select("*", { count: "exact", head: true }),
    sb.from("products").select("name_ar,stock").lte("stock", 5).eq("is_active", true).order("stock").limit(8),
  ]);
  const all = orders ?? [];
  const counted = all.filter((o) => o.status !== "cancelled");
  const revenue = counted.reduce((s, o) => s + Number(o.total_egp), 0);
  const by = (st: string) => all.filter((o) => o.status === st).length;
  const cards = [
    ["إجمالي الطلبات", all.length], ["إيرادات (بدون الملغي)", formatEGP(revenue)], ["قيد المراجعة", by("pending")], ["المنتجات", products ?? 0],
  ];
  return (
    <div>
      <h1 className="font-display text-3xl">الإحصائيات</h1>
      <ul className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map(([k, v]) => <li key={k} className="card p-5"><p className="text-sm text-forest/60">{k}</p><p className="mt-1 text-2xl font-bold">{v}</p></li>)}
      </ul>
      <h2 className="mt-10 font-display text-2xl">مخزون منخفض</h2>
      {(low ?? []).length === 0 ? <p className="mt-3 text-forest/60">لا توجد منتجات منخفضة المخزون.</p> : (
        <ul className="card mt-3 divide-y divide-beige">{low!.map((p) => <li key={p.name_ar} className="flex justify-between p-3 text-sm"><span>{p.name_ar}</span><span>{p.stock}</span></li>)}</ul>
      )}
    </div>
  );
}
