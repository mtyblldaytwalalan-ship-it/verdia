"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function Form() {
  const router = useRouter();
  const next = useSearchParams().get("next") ?? "/account";
  const [mode, setMode] = useState<"login" | "register">("login");
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "error" | "ok"; text: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email)) return setMsg({ type: "error", text: "البريد الإلكتروني غير صحيح." });
    if (f.password.length < 8) return setMsg({ type: "error", text: "كلمة المرور يجب ألا تقل عن 8 أحرف." });
    if (mode === "register" && f.name.trim().length < 2) return setMsg({ type: "error", text: "يرجى إدخال الاسم." });
    setBusy(true);
    const sb = createClient();
    if (mode === "login") {
      const { error } = await sb.auth.signInWithPassword({ email: f.email, password: f.password });
      setBusy(false);
      if (error) return setMsg({ type: "error", text: "البريد الإلكتروني أو كلمة المرور غير صحيحة." });
      router.push(next); router.refresh();
    } else {
      const { data, error } = await sb.auth.signUp({ email: f.email, password: f.password, options: { data: { full_name: f.name } } });
      setBusy(false);
      if (error) return setMsg({ type: "error", text: "تعذر إنشاء الحساب. قد يكون البريد مستخدمًا بالفعل." });
      if (data.session) { router.push(next); router.refresh(); }
      else setMsg({ type: "ok", text: "تم إنشاء الحساب. تحققي من بريدك الإلكتروني لتأكيد الحساب ثم سجلي الدخول." });
    }
  };

  return (
    <div className="container-x py-16">
      <form onSubmit={submit} noValidate className="card mx-auto max-w-md space-y-4 p-8">
        <h1 className="font-display text-3xl text-center">{mode === "login" ? "تسجيل الدخول" : "إنشاء حساب"}</h1>
        {mode === "register" && <div><label className="label" htmlFor="n">الاسم</label><input id="n" className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="name" /></div>}
        <div><label className="label" htmlFor="e">البريد الإلكتروني</label><input id="e" dir="ltr" type="email" className="input text-end" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" /></div>
        <div><label className="label" htmlFor="p">كلمة المرور</label><input id="p" dir="ltr" type="password" className="input text-end" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete={mode === "login" ? "current-password" : "new-password"} /></div>
        {msg && <p role="alert" className={`text-sm ${msg.type === "error" ? "text-red-700" : "text-forest-700"}`}>{msg.text}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? "..." : mode === "login" ? "دخول" : "إنشاء الحساب"}</button>
        <button type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setMsg(null); }} className="block w-full text-center text-sm underline">
          {mode === "login" ? "ليس لديك حساب؟ أنشئي حسابًا" : "لديك حساب؟ سجلي الدخول"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() { return <Suspense><Form /></Suspense>; }
