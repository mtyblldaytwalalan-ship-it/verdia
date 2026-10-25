import Link from "next/link";
import Logo from "./Logo";
import NewsletterForm from "./NewsletterForm";
import { getCategories, getSettings } from "@/lib/data";

export default async function Footer() {
  let s: Record<string, string> = {};
  let cats: { slug: string; name_ar: string }[] = [];
  try { [s, cats] = await Promise.all([getSettings(), getCategories()]); } catch { /* backend not configured yet */ }

  const socials = [
    { key: "facebook", label: "فيسبوك" },
    { key: "instagram", label: "إنستغرام" },
    { key: "tiktok", label: "تيك توك" },
    { key: "whatsapp", label: "واتساب" },
  ].filter((x) => s[x.key]);

  return (
    <footer className="mt-24 bg-forest text-ivory">
      <div className="container-x grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo light />
          <p className="mt-4 text-sm text-ivory/80">بشرتك تستحق الأفضل</p>
          <div className="mt-6"><NewsletterForm compact /></div>
        </div>
        <div>
          <h3 className="mb-4 font-display text-xl text-gold">روابط سريعة</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/products">المنتجات</Link></li>
            <li><Link href="/about">من نحن</Link></li>
            <li><Link href="/contact">تواصل معنا</Link></li>
            <li><Link href="/pages/shipping">الشحن والتوصيل</Link></li>
            <li><Link href="/pages/returns">الاستبدال والاسترجاع</Link></li>
            <li><Link href="/pages/privacy">سياسة الخصوصية</Link></li>
            <li><Link href="/pages/terms">الشروط والأحكام</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-4 font-display text-xl text-gold">التصنيفات</h3>
          <ul className="space-y-2 text-sm">
            {cats.map((c) => <li key={c.slug}><Link href={`/products?category=${c.slug}`}>{c.name_ar}</Link></li>)}
          </ul>
        </div>
        <div>
          <h3 className="mb-4 font-display text-xl text-gold">تواصل معنا</h3>
          <ul className="space-y-2 text-sm text-ivory/90">
            {s.phone && <li dir="ltr" className="text-end">{s.phone}</li>}
            {s.email && <li dir="ltr" className="text-end">{s.email}</li>}
            {s.address && <li>{s.address}</li>}
            {!s.phone && !s.email && !s.address && <li className="text-ivory/60">سيتم إضافة بيانات التواصل قريبًا.</li>}
          </ul>
          {socials.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-3 text-sm">
              {socials.map((x) => <li key={x.key}><a href={s[x.key]} target="_blank" rel="noopener noreferrer" className="rounded-full border border-gold/60 px-3 py-1 hover:bg-gold hover:text-forest">{x.label}</a></li>)}
            </ul>
          )}
        </div>
      </div>
      <div className="border-t border-ivory/15 py-5 text-center text-xs text-ivory/70">
        © {new Date().getFullYear()} Verdia — جميع الحقوق محفوظة
      </div>
    </footer>
  );
}
