import { createClient } from "./supabase/server";
import type { Category, Product } from "./types";

export async function getSettings(): Promise<Record<string, string>> {
  const sb = await createClient();
  const { data } = await sb.from("store_settings").select("key,value");
  return Object.fromEntries((data ?? []).map((r) => [r.key, r.value ?? ""]));
}

export async function getCategories(): Promise<Category[]> {
  const sb = await createClient();
  const { data } = await sb.from("categories").select("id,slug,name_ar,image_url").eq("is_active", true).order("sort_order");
  return data ?? [];
}

export async function getActiveBanner(kind: "hero" | "promo") {
  const sb = await createClient();
  const { data } = await sb.from("banners").select("*").eq("kind", kind).eq("is_active", true).order("sort_order").limit(1).maybeSingle();
  return data;
}

export async function getFeatured(limit = 8): Promise<Product[]> {
  const sb = await createClient();
  const { data } = await sb.from("products").select("*").eq("is_active", true).order("created_at", { ascending: false }).limit(limit);
  return (data ?? []) as Product[];
}

/** Average rating and count from approved reviews only — never invented. */
export async function getRatings(ids: string[]): Promise<Record<string, { avg: number; n: number }>> {
  if (!ids.length) return {};
  const sb = await createClient();
  const { data } = await sb.from("reviews").select("product_id,rating").in("product_id", ids).eq("is_approved", true);
  const acc: Record<string, { sum: number; n: number }> = {};
  (data ?? []).forEach((r) => { (acc[r.product_id] ??= { sum: 0, n: 0 }); acc[r.product_id].sum += r.rating; acc[r.product_id].n++; });
  return Object.fromEntries(Object.entries(acc).map(([k, v]) => [k, { avg: v.sum / v.n, n: v.n }]));
}
