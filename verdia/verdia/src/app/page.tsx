import Link from "next/link";
import Image from "next/image";
import ProductCard from "@/components/ProductCard";
import NewsletterForm from "@/components/NewsletterForm";
import { HeadsetIcon, HeartIcon, LeafIcon, ShieldIcon, StarIcon, TruckIcon } from "@/components/Icons";
import { Leaf } from "@/components/Logo";
import { getActiveBanner, getCategories, getFeatured, getRatings } from "@/lib/data";
import type { Category, Product } from "@/lib/types";

export const revalidate = 60;

const BENEFITS = [
  { icon: <ShieldIcon />, title: "منتجات أصلية", text: "نعرض بيانات كل منتج بشفافية." },
  { icon: <LeafIcon />, title: "مكونات مختارة بعناية", text: "اطلعي على المكونات في صفحة المنتج." },
  { icon: <TruckIcon />, title: "شحن سريع لجميع المحافظات", text: "رسوم واضحة قبل إتمام الطلب." },
  { icon: <HeadsetIcon />, title: "دعم فني وخدمة عملاء", text: "نسعد بمساعدتك في أي وقت." },
];

const VALUES = [
  { icon: <LeafIcon />, title: "عناية متوازنة", text: "اختيار منتجات تناسب احتياجات بشرتك." },
  { icon: <StarIcon />, title: "تجربة تسوق راقية", text: "تصفح سهل وطلب واضح من البداية للنهاية." },
  { icon: <HeartIcon />, title: "اهتمام بجمالك", text: "نهتم بالتفاصيل لنقدم لك الأفضل." },
];

export default async function Home() {
  let cats: Category[] = [], products: Product[] = [], ratings: Record<string, { avg: number; n: number }> = {};
  let hero: Awaited<ReturnType<typeof getActiveBanner>> = null, promo: typeof hero = null;
  let backendError = false;
  try {
    [cats, products, hero, promo] = await Promise.all([getCategories(), getFeatured(8), getActiveBanner("hero"), getActiveBanner("promo")]);
    ratings = await getRatings(products.map((p) => p.id));
  } catch { backendError = true; }

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-gradient-to-l from-sage-200 via-ivory to-beige">
        {hero?.image_url && <Image src={hero.image_url} alt="" fill priority sizes="100vw" className="object-cover -z-10" />}
        <Leaf className="absolute -top-6 start-0 -z-10 h-72 w-72 -rotate-12 text-sage/30" />
        <Leaf className="absolute bottom-0 end-10 -z-10 h-56 w-56 rotate-45 text-forest/10" />
        <div className="container-x grid min-h-[480px] items-center py-16 md:min-h-[560px]">
          <div className="max-w-xl">
            {hero?.badge_text && <span className="mb-5 inline-block rounded-full border border-gold bg-white/70 px-5 py-1.5 text-sm font-semibold text-gold-600">{hero.badge_text}</span>}
            <h1 className="font-display text-5xl leading-tight md:text-7xl">{hero?.title_ar ?? "بشرتك تستحق الأفضل"}</h1>
            <p className="mt-5 text-lg text-forest/80">{hero?.subtitle_ar ?? "اكتشفي عالم العناية بالبشرة بمنتجات مختارة بعناية لإطلالة أكثر نضارة وجمالًا."}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={hero?.link_url ?? "/products"} className="btn-primary">تسوقي الآن</Link>
              <Link href="#categories" className="btn-outline">اكتشفي مجموعتنا</Link>
            </div>
          </div>
        </div>
      </section>

      {backendError && (
        <p role="alert" className="container-x mt-6 rounded-xl bg-gold/20 p-4 text-sm">لم يتم ربط قاعدة البيانات بعد. أضيفي مفاتيح Supabase في ملف .env.local (راجعي README).</p>
      )}

      {/* Benefits */}
      <section className="border-y border-beige bg-ivory-200">
        <ul className="container-x grid grid-cols-2 gap-6 py-8 text-center lg:grid-cols-4">
          {BENEFITS.map((b) => (
            <li key={b.title} className="flex flex-col items-center gap-2 text-forest">
              <span className="text-gold-600">{b.icon}</span>
              <h3 className="text-sm font-semibold">{b.title}</h3>
              <p className="text-xs text-forest/70">{b.text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Categories */}
      <section id="categories" className="container-x scroll-mt-24 pt-16">
        <h2 className="section-title">تسوقي حسب الفئة</h2>
        {cats.length === 0 ? <p className="mt-8 text-center text-forest/60">لا توجد تصنيفات بعد.</p> : (
          <ul className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {cats.map((c) => (
              <li key={c.id}>
                <Link href={`/products?category=${c.slug}`} className="card group block overflow-hidden text-center transition hover:-translate-y-1">
                  <div className="relative aspect-[4/3] bg-gradient-to-br from-sage-200 to-beige">
                    {c.image_url ? <Image src={c.image_url} alt="" fill sizes="200px" className="object-cover" /> : <Leaf className="absolute inset-0 m-auto h-12 w-12 text-sage" />}
                  </div>
                  <span className="block py-3 text-sm font-medium group-hover:text-gold-600">{c.name_ar}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Promo banner — only shown when an admin has activated one */}
      {promo && (
        <section className="container-x pt-16">
          <div className="relative overflow-hidden rounded-3xl bg-forest p-10 text-ivory md:p-14">
            {promo.image_url && <Image src={promo.image_url} alt="" fill sizes="100vw" className="object-cover opacity-40" />}
            <div className="relative max-w-lg">
              {promo.badge_text && <span className="mb-3 inline-block rounded-full bg-gold px-4 py-1 text-sm font-bold text-forest">{promo.badge_text}</span>}
              <h2 className="font-display text-4xl">{promo.title_ar}</h2>
              {promo.subtitle_ar && <p className="mt-3 text-ivory/85">{promo.subtitle_ar}</p>}
              <Link href={promo.link_url ?? "/products"} className="btn-gold mt-6">تسوقي الآن</Link>
            </div>
          </div>
        </section>
      )}

      {/* Featured */}
      <section className="container-x pt-16">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-3xl md:text-4xl">أحدث المنتجات</h2>
          <Link href="/products" className="text-sm underline-offset-4 hover:underline">عرض الكل ←</Link>
        </div>
        {products.length === 0 ? <p className="mt-8 rounded-2xl bg-white p-10 text-center text-forest/60">لا توجد منتجات متاحة حاليًا.</p> : (
          <>
            <ul className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {products.map((p) => <li key={p.id}><ProductCard p={p} rating={ratings[p.id]} /></li>)}
            </ul>
            {products.some((p) => p.is_sample) && <p className="mt-4 text-center text-xs text-forest/60">المنتجات المعروضة بعلامة «عينة» بيانات تجريبية إلى أن يضيف المتجر مخزونه الفعلي.</p>}
          </>
        )}
      </section>

      {/* Brand story */}
      <section className="container-x pt-20">
        <div className="overflow-hidden rounded-3xl bg-forest text-ivory">
          <div className="grid gap-10 p-10 md:p-14 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-4xl">لماذا Verdia؟</h2>
              <p className="mt-4 max-w-md text-ivory/85">نؤمن أن العناية بالبشرة تبدأ باختيار المنتجات المناسبة، لذلك نسعى لتقديم تجربة تسوق تجمع بين الجودة والاهتمام بجمالك.</p>
              <Link href="/about" className="btn-gold mt-6">من نحن</Link>
            </div>
            <ul className="grid gap-6 sm:grid-cols-3">
              {VALUES.map((v) => (
                <li key={v.title} className="text-center">
                  <span className="mx-auto block w-fit text-gold">{v.icon}</span>
                  <h3 className="mt-2 text-sm font-semibold">{v.title}</h3>
                  <p className="mt-1 text-xs text-ivory/75">{v.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="container-x pt-20">
        <div className="mx-auto max-w-xl rounded-3xl border border-beige bg-white p-8 text-center shadow-soft">
          <h2 className="font-display text-3xl">انضمي إلى عالم Verdia</h2>
          <p className="mt-2 text-sm text-forest/70">اشتركي ليصلك جديدنا وعروضنا.</p>
          <div className="mt-5 text-start [&_label]:text-forest/80"><NewsletterForm /></div>
        </div>
      </section>
    </>
  );
}
