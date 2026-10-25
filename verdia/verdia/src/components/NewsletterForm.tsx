"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [msg, setMsg] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { setState("error"); setMsg("يرجى إدخال بريد إلكتروني صحيح."); return; }
    if (!consent) { setState("error"); setMsg("يرجى الموافقة على استلام الرسائل التسويقية."); return; }
    setState("loading");
    const { error } = await createClient().from("newsletter_subscribers").insert({ email: email.toLowerCase(), consent: true });
    if (error) {
      setState("error");
      setMsg(error.code === "23505" ? "هذا البريد مشترك بالفعل." : "تعذر الاشتراك الآن. حاولي مرة أخرى لاحقًا.");
    } else { setState("ok"); setMsg("تم الاشتراك بنجاح. شكرًا لك!"); setEmail(""); setConsent(false); }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-2">
      <label className="sr-only" htmlFor={`nl-${compact}`}>البريد الإلكتروني</label>
      <div className="flex gap-2">
        <input id={`nl-${compact}`} type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="بريدك الإلكتروني" className="input !rounded-full !py-2 text-forest" />
        <button className="btn-gold !py-2 shrink-0" disabled={state === "loading"}>{state === "loading" ? "..." : "اشتراك"}</button>
      </div>
      <label className="flex items-start gap-2 text-xs text-ivory/80">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
        أوافق على استلام رسائل Verdia التسويقية ويمكنني إلغاء الاشتراك في أي وقت.
      </label>
      <p role="status" aria-live="polite" className={`text-xs ${state === "ok" ? "text-sage" : "text-red-300"}`}>{state === "ok" || state === "error" ? msg : ""}</p>
    </form>
  );
}
