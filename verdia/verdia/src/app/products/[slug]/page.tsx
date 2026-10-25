import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getRatings } from "@/lib/data";
import ProductCard from "@/components/ProductCard";
import AddToCart from "@/components/AddToCart";
import { discountPercent, formatEGP } from "@/lib/format";
import type { Product } from "@/lib/types";

async function load(slug: string) {
  const sb = await createClient();
  const { data } = await sb.from("products").select("*").eq("slug", slug).eq("is_active", true).maybeSingle();
  return { sb, product: data as Product | null };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { product } = await load((await params).slug);
  if (!product) return { title: "منتج غير موجود" };
  return {
    title: product.name_ar,
    description: product.description_ar?.slice(0, 155) ?? undefined,
    openGraph: { images: product.images[0] ? [product.images[0]] : [] },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { sb, product: p } = await load((await params).slug);
  if (!p) notFound();

  const [{ data: related }, ratings, { data: reviews }] = await Promise.all([
    sb.from("products").select("*").eq("is_active", true).eq("category_id", p.category_id ?? "").neq("id", p.id).limit(4),
    getRatings([p.id]),
    sb.from("reviews").select("rating,body,created_at").eq("product_id", p.id).eq("is_approved", true).order("created_at", { ascending: false }).limit(10),
  ]);
  const rating = ratings[p.id];
  const off = discountPercent(p.price_egp, p.compare_at_price_egp);

  const jsonLd = {
    "@context": "https://schema.org", "@type": "Product", name: p.name_ar, description: p.description_ar ?? undefined,
    image: p.images,
    offers: { "@type": "Offer", priceCurrency: "EGP", price: p.price_egp, availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" },
    ...(rating ? { aggregateRating: { "@type": "AggregateRating", ratingValue: rating.avg.toFixed(1), reviewCount: rating.n } } : {}),
  };

  return (
    <div className="container-x py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="مسار التنقل" className="mb-6 text-sm text-forest/60"><Link href="/">الرئيسية</Link> / <Link href="/products">المنتجات</Link> / {p.name_ar}</nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-ivory-200">
            {p.images[0] ? <Image src={p.images[0]} alt={p.name_ar} fill priority sizes="(max-width:1024px) 100vw, 50vw" className="object-contain p-8" /> : <div className="grid h-full place-items-center text-forest/40">لا توجد صورة</div>}
          </div>
          {p.images.length > 1 && (
            <ul className="mt-3 flex gap-2">
              {p.images.slice(1, 5).map((src, i) => (
                <li key={src} className="relative h-20 w-20 overflow-hidden rounded-lg bg-ivory-200"><Image src={src} alt={`${p.name_ar} - صورة ${i + 2}`} fill sizes="80px" className="object-contain p-1" /></li>
              ))}
            </ul>
          )}
        </div>

        <div>
          {p.is_sample && <span className="mb-3 inline-block rounded-full bg-gold/90 px-3 py-0.5 text-xs">منتج تجريبي (عينة)</span>}
          <h1 className="font-display text-4xl">{p.name_ar}</h1>
          {rating && <p className="mt-2 text-gold">{"★".repeat(Math.round(rating.avg))}{"☆".repeat(5 - Math.round(rating.avg))} <span className="text-sm text-forest/60">({rating.n} تقييم)</span></p>}
          <p className="mt-4 text-2xl font-semibold">
            {formatEGP(p.price_egp)}
            {off > 0 && p.compare_at_price_egp && <><span className="ms-3 text-base font-normal text-forest/50 line-through">{formatEGP(p.compare_at_price_egp)}</span><span className="ms-3 rounded-full bg-forest px-2 py-0.5 text-xs text-ivory">خصم {off}%</span></>}
          </p>
          <p className="mt-4 whitespace-pre-line text-forest/85">{p.description_ar || "لا يوجد وصف لهذا المنتج بعد."}</p>
          <AddToCart product={p} />
        </div>
      </div>

      <section className="mt-16" aria-labelledby="rev">
        <h2 id="rev" className="font-display text-3xl">آراء العملاء</h2>
        {(reviews ?? []).length === 0 ? <p className="mt-4 text-forest/60">لا توجد تقييمات بعد.</p> : (
          <ul className="mt-4 space-y-3">
            {reviews!.map((r, i) => (
              <li key={i} className="card p-4"><p className="text-gold">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</p>{r.body && <p className="mt-1 text-sm">{r.body}</p>}</li>
            ))}
          </ul>
        )}
      </section>

      {(related ?? []).length > 0 && (
        <section className="mt-16" aria-labelledby="rel">
          <h2 id="rel" className="font-display text-3xl">منتجات مشابهة</h2>
          <ul className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {(related as Product[]).map((r) => <li key={r.id}><ProductCard p={r} /></li>)}
          </ul>
        </section>
      )}
    </div>
  );
}
