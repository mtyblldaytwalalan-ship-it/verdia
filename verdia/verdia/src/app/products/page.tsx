import Link from "next/link";
import type { Metadata } from "next";
import ProductCard from "@/components/ProductCard";
import { createClient } from "@/lib/supabase/server";
import { getCategories, getRatings } from "@/lib/data";
import type { Product } from "@/lib/types";

export const metadata: Metadata = { title: "المنتجات", description: "تصفحي منتجات Verdia للعناية بالبشرة." };

const PAGE_SIZE = 12;
type SP = { q?: string; category?: string; sort?: string; min?: string; max?: string; stock?: string; page?: string };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const sb = await createClient();
  const cats = await getCategories();

  let query = sb.from("products").select("*", { count: "exact" }).eq("is_active", true);
  const cat = cats.find((c) => c.slug === sp.category);
  if (cat) query = query.eq("category_id", cat.id);
  if (sp.q?.trim()) {
    // strip characters that have meaning in PostgREST filter syntax
    const term = sp.q.trim().replace(/[%,()*]/g, " ");
    query = query.or(`name_ar.ilike.%${term}%,description_ar.ilike.%${term}%`);
  }
  if (Number(sp.min) > 0) query = query.gte("price_egp", Number(sp.min));
  if (Number(sp.max) > 0) query = query.lte("price_egp", Number(sp.max));
  if (sp.stock === "1") query = query.gt("stock", 0);
  query = sp.sort === "price_asc" ? query.order("price_egp", { ascending: true })
    : sp.sort === "price_desc" ? query.order("price_egp", { ascending: false })
    : query.order("created_at", { ascending: false });

  const from = (page - 1) * PAGE_SIZE;
  const { data, count, error } = await query.range(from, from + PAGE_SIZE - 1);
  const products = (data ?? []) as Product[];
  const ratings = await getRatings(products.map((p) => p.id));
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  const href = (over: Partial<SP>) => {
    const p = new URLSearchParams();
    Object.entries({ ...sp, ...over }).forEach(([k, v]) => { if (v) p.set(k, String(v)); });
    return `/products?${p.toString()}`;
  };

  return (
    <div className="container-x py-10">
      <h1 className="font-display text-4xl">{cat ? cat.name_ar : sp.q ? `نتائج البحث عن «${sp.q}»` : "جميع المنتجات"}</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside>
          <form method="get" className="card space-y-4 p-5" aria-label="الفلاتر">
            {sp.q && <input type="hidden" name="q" value={sp.q} />}
            <div>
              <label className="label" htmlFor="category">التصنيف</label>
              <select id="category" name="category" defaultValue={sp.category ?? ""} className="input">
                <option value="">الكل</option>
                {cats.map((c) => <option key={c.id} value={c.slug}>{c.name_ar}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="label" htmlFor="min">من (ج.م)</label><input id="min" name="min" type="number" min="0" defaultValue={sp.min} className="input" /></div>
              <div><label className="label" htmlFor="max">إلى (ج.م)</label><input id="max" name="max" type="number" min="0" defaultValue={sp.max} className="input" /></div>
            </div>
            <div>
              <label className="label" htmlFor="sort">الترتيب</label>
              <select id="sort" name="sort" defaultValue={sp.sort ?? ""} className="input">
                <option value="">الأحدث</option>
                <option value="price_asc">السعر: من الأقل للأعلى</option>
                <option value="price_desc">السعر: من الأعلى للأقل</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="stock" value="1" defaultChecked={sp.stock === "1"} /> المتوفر فقط</label>
            <button className="btn-primary w-full">تطبيق</button>
            <Link href="/products" className="block text-center text-xs underline">مسح الفلاتر</Link>
          </form>
        </aside>

        <section aria-live="polite">
          {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800">تعذر تحميل المنتجات. حاولي مرة أخرى لاحقًا.</p>}
          {!error && products.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-lg">لم نعثر على منتجات مطابقة.</p>
              <Link href="/products" className="btn-primary mt-5">عرض كل المنتجات</Link>
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-4 xl:grid-cols-3">
              {products.map((p) => <li key={p.id}><ProductCard p={p} rating={ratings[p.id]} /></li>)}
            </ul>
          )}

          {pages > 1 && (
            <nav className="mt-10 flex flex-wrap justify-center gap-2" aria-label="الصفحات">
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <Link key={n} href={href({ page: String(n) })} aria-current={n === page ? "page" : undefined}
                  className={`grid h-10 w-10 place-items-center rounded-full border ${n === page ? "border-forest bg-forest text-ivory" : "border-sage hover:border-forest"}`}>{n}</Link>
              ))}
            </nav>
          )}
        </section>
      </div>
    </div>
  );
}
