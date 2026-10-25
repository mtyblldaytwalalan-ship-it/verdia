import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatEGP } from "@/lib/format";
import SignOut from "@/components/SignOut";

export const metadata = { title: "حسابي", robots: { index: false } };
const STATUS: Record<string, string> = { pending: "قيد المراجعة", confirmed: "تم التأكيد", shipped: "تم الشحن", delivered: "تم التسليم", cancelled: "ملغي" };

export default async function Account() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login?next=/account");
  const [{ data: profile }, { data: orders }] = await Promise.all([
    sb.from("profiles").select("full_name,role").eq("id", user.id).single(),
    sb.from("orders").select("order_number,phone,status,total_egp,created_at").order("created_at", { ascending: false }),
  ]);

  return (
    <div className="container-x py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl">أهلًا {profile?.full_name ?? ""}</h1>
        <div className="flex gap-2">
          {profile?.role === "admin" && <Link href="/admin" className="btn-gold">لوحة التحكم</Link>}
          <SignOut />
        </div>
      </div>
      <h2 className="mt-10 font-display text-2xl">طلباتي</h2>
      {(orders ?? []).length === 0 ? (
        <div className="card mt-4 p-10 text-center">لا توجد طلبات بعد. <Link href="/products" className="underline">ابدئي التسوق</Link></div>
      ) : (
        <ul className="mt-4 space-y-3">
          {orders!.map((o) => (
            <li key={o.order_number} className="card flex flex-wrap items-center justify-between gap-3 p-4">
              <Link href={`/order/${o.order_number}?phone=${encodeURIComponent(o.phone)}`} className="font-semibold underline" dir="ltr">{o.order_number}</Link>
              <span className="text-sm">{new Date(o.created_at).toLocaleDateString("ar-EG")}</span>
              <span className="text-sm">{STATUS[o.status]}</span>
              <span className="font-semibold">{formatEGP(o.total_egp)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
