import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "لوحة التحكم", robots: { index: false, follow: false } };

const LINKS = [
  ["/admin", "الإحصائيات"], ["/admin/orders", "الطلبات"], ["/admin/products", "المنتجات"], ["/admin/categories", "التصنيفات"],
  ["/admin/shipping", "الشحن"], ["/admin/banners", "البانرات"], ["/admin/promotions", "أكواد الخصم"],
  ["/admin/reviews", "التقييمات"], ["/admin/settings", "إعدادات المتجر"],
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Defense in depth: middleware already checks, and RLS enforces it again on every query.
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login?next=/admin");
  const { data: profile } = await sb.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/");

  return (
    <div className="container-x grid gap-8 py-10 lg:grid-cols-[220px_1fr]">
      <nav aria-label="لوحة التحكم" className="card h-fit p-3">
        <ul className="flex gap-1 overflow-x-auto lg:flex-col">
          {LINKS.map(([href, label]) => <li key={href}><Link href={href} className="block whitespace-nowrap rounded-lg px-3 py-2 text-sm hover:bg-ivory-200">{label}</Link></li>)}
        </ul>
      </nav>
      <div>{children}</div>
    </div>
  );
}
