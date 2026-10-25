"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOut() {
  const router = useRouter();
  return (
    <button className="btn-outline" onClick={async () => { await createClient().auth.signOut(); router.push("/"); router.refresh(); }}>
      تسجيل الخروج
    </button>
  );
}
