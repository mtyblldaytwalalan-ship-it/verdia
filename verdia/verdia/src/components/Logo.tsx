import Link from "next/link";

export function Leaf({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden="true">
      <path d="M6 26C6 13 14 5 27 5c0 13-8 21-21 21Z" fill="currentColor" opacity=".95" />
      <path d="M6 26 20 12" stroke="#FAF8F2" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export default function Logo({ light = false, tagline = true }: { light?: boolean; tagline?: boolean }) {
  return (
    <Link href="/" aria-label="Verdia - الرئيسية" className={`inline-flex flex-col items-center leading-none ${light ? "text-ivory" : "text-forest"}`} dir="ltr">
      <span className="relative font-latin text-4xl font-semibold tracking-wide">
        <Leaf className="absolute -top-3 left-[52%] h-5 w-5 text-gold" />
        Verdia
      </span>
      {tagline && <span className="mt-1 text-[9px] tracking-[0.35em] text-gold">SKIN CARE STORE</span>}
    </Link>
  );
}
