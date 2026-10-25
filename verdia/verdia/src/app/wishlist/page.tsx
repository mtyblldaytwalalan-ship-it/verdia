"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ProductCard from "@/components/ProductCard";
import { useCart } from "@/lib/cart";
import { createClient } from "@/lib/supabase/client";
import type { Product } from "@/lib/types";

export default function Wishlist() {
  const { wishlist, ready } = useCart();
  const sb = useMemo(() => createClient(), []);
  const [items, setItems] = useState<Product[] | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (wishlist.length === 0) { setItems([]); return; }
    sb.from("products").select("*").in("id", wishlist).eq("is_active", true).then(({ data }) => setItems((data ?? []) as Product[]));
  }, [ready, wishlist, sb]);

  return (
    <div className="container-x py-10">
      <h1 className="font-display text-4xl">المفضلة</h1>
      {items === null ? <p className="mt-8" role="status">جارٍ التحميل...</p> : items.length === 0 ? (
        <div className="card mt-8 p-12 text-center"><p>لم تضيفي أي منتج إلى المفضلة بعد.</p><Link href="/products" className="btn-primary mt-5">تصفحي المنتجات</Link></div>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">{items.map((p) => <li key={p.id}><ProductCard p={p} /></li>)}</ul>
      )}
    </div>
  );
}
