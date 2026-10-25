"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Logo from "./Logo";
import { useCart } from "@/lib/cart";

const NAV = [
  { href: "/", label: "الرئيسية" },
  { href: "/products", label: "المنتجات" },
  { href: "/#categories", label: "التصنيفات" },
  { href: "/about", label: "من نحن" },
  { href: "/contact", label: "تواصل معنا" },
];

const icon = "h-5 w-5";

export default function Header() {
  const { count, ready } = useCart();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    setOpen(false);
    router.push(q.trim() ? `/products?q=${encodeURIComponent(q.trim())}` : "/products");
  };

  return (
    <header className={`sticky top-0 z-40 bg-forest text-ivory transition-all duration-300 ${scrolled ? "shadow-soft py-1" : "py-3"}`}>
      <div className="container-x flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 lg:hidden">
          <button aria-label="القائمة" aria-expanded={open} onClick={() => setOpen(!open)} className="p-2">
            <svg className={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" /></svg>
          </button>
        </div>

        <div className={`transition-transform ${scrolled ? "scale-90" : ""}`}><Logo light tagline={!scrolled} /></div>

        <nav className="hidden lg:flex items-center gap-8 text-sm" aria-label="التنقل الرئيسي">
          {NAV.map((n) => <Link key={n.href} href={n.href} className="hover:text-gold transition">{n.label}</Link>)}
        </nav>

        <div className="flex items-center gap-2 md:gap-4">
          <form onSubmit={search} role="search" className="hidden md:flex items-center rounded-full border border-gold/60 px-4 py-1.5">
            <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="بحث عن منتج" placeholder="ابحث عن منتجك المفضل..." className="w-48 bg-transparent text-sm placeholder:text-ivory/60 outline-none" />
            <button aria-label="بحث"><svg className={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" strokeLinecap="round" /></svg></button>
          </form>
          <Link href="/wishlist" aria-label="المفضلة" className="hidden p-2 hover:text-gold sm:block">♡</Link>
          <Link href="/account" aria-label="حسابي" className="p-2 hover:text-gold">
            <svg className={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="8" r="4" /><path d="M4 20c1-4 4-6 8-6s7 2 8 6" strokeLinecap="round" /></svg>
          </Link>
          <Link href="/cart" aria-label={`السلة، ${count} منتج`} className="relative p-2 hover:text-gold">
            <svg className={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 4h2l2.4 11h10.2L20 7H6" strokeLinecap="round" strokeLinejoin="round" /><circle cx="9" cy="19" r="1.2" /><circle cx="17" cy="19" r="1.2" /></svg>
            {ready && count > 0 && <span className="absolute -top-0.5 -start-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[11px] font-bold text-forest">{count}</span>}
          </Link>
        </div>
      </div>

      {open && (
        <div className="container-x lg:hidden pb-4 pt-2">
          <form onSubmit={search} role="search" className="mb-3 flex items-center rounded-full border border-gold/60 px-4 py-2">
            <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="بحث عن منتج" placeholder="ابحث عن منتجك المفضل..." className="flex-1 bg-transparent text-sm placeholder:text-ivory/60 outline-none" />
            <button aria-label="بحث">🔍</button>
          </form>
          <nav className="flex flex-col" aria-label="التنقل">
            {NAV.map((n) => <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="border-b border-ivory/10 py-3">{n.label}</Link>)}
          </nav>
        </div>
      )}
    </header>
  );
}
