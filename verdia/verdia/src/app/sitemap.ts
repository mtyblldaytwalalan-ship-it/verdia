import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const staticPages = ["", "/products", "/about", "/contact"].map((p) => ({ url: `${base}${p}` }));
  try {
    const sb = await createClient();
    const { data } = await sb.from("products").select("slug").eq("is_active", true);
    return [...staticPages, ...(data ?? []).map((p) => ({ url: `${base}/products/${p.slug}` }))];
  } catch { return staticPages; }
}
