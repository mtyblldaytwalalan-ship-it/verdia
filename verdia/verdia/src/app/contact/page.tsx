import { getSettings } from "@/lib/data";

export const metadata = { title: "تواصل معنا" };
export const revalidate = 60;

export default async function Contact() {
  let s: Record<string, string> = {};
  try { s = await getSettings(); } catch {}
  const rows = [["الهاتف", s.phone], ["البريد الإلكتروني", s.email], ["العنوان", s.address]].filter(([, v]) => v);
  return (
    <div className="container-x max-w-2xl py-14">
      <h1 className="font-display text-4xl">تواصل معنا</h1>
      {rows.length === 0 ? (
        <p className="mt-6 text-forest/70">سيتم إضافة بيانات التواصل قريبًا.</p>
      ) : (
        <dl className="card mt-6 space-y-3 p-6">
          {rows.map(([k, v]) => <div key={k}><dt className="text-sm text-forest/60">{k}</dt><dd dir="auto">{v}</dd></div>)}
        </dl>
      )}
    </div>
  );
}
