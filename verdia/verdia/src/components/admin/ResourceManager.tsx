"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type Field = {
  name: string; label: string;
  type?: "text" | "number" | "textarea" | "checkbox" | "select" | "datetime";
  options?: { value: string; label: string }[];
  required?: boolean; readOnlyOnEdit?: boolean; ltr?: boolean;
};
type Row = Record<string, any>;

export default function ResourceManager(props: {
  title: string; table: string; pk: string; fields: Field[]; columns: string[];
  orderBy?: string; canCreate?: boolean; canDelete?: boolean; defaults?: Row; hint?: string;
}) {
  const { title, table, pk, fields, columns, orderBy, canCreate = true, canDelete = true, defaults = {}, hint } = props;
  const sb = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Row | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [msg, setMsg] = useState<{ type: "error" | "ok"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await sb.from(table).select("*").order(orderBy ?? pk);
    if (error) setMsg({ type: "error", text: "تعذر تحميل البيانات." });
    setRows(data ?? []); setLoading(false);
  }, [sb, table, orderBy, pk]);
  useEffect(() => { load(); }, [load]);

  const label = (n: string) => fields.find((f) => f.name === n)?.label ?? n;
  const show = (v: any) => (v === true ? "نعم" : v === false ? "لا" : v ?? "—");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const payload: Row = {};
    for (const f of fields) {
      let v = editing[f.name];
      if (f.type === "number") v = v === "" || v == null ? null : Number(v);
      if (f.type === "datetime") v = v ? new Date(v).toISOString() : null;
      if ((f.type === undefined || f.type === "text" || f.type === "textarea") && v === "") v = f.required ? v : null;
      if (f.required && (v === null || v === undefined || v === "")) return setMsg({ type: "error", text: `الحقل مطلوب: ${f.label}` });
      payload[f.name] = v ?? (f.type === "checkbox" ? false : null);
    }
    const res = isNew ? await sb.from(table).insert(payload) : await sb.from(table).update(payload).eq(pk, editing[pk]);
    if (res.error) return setMsg({ type: "error", text: "تعذر الحفظ. تأكدي من صحة البيانات وصلاحياتك." });
    setMsg({ type: "ok", text: "تم الحفظ." }); setEditing(null); load();
  };

  const del = async (row: Row) => {
    if (!confirm("هل أنت متأكدة من الحذف؟")) return;
    const { error } = await sb.from(table).delete().eq(pk, row[pk]);
    if (error) setMsg({ type: "error", text: "تعذر الحذف." }); else { setMsg({ type: "ok", text: "تم الحذف." }); load(); }
  };

  const toLocal = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() - new Date(iso).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl">{title}</h1>
        {canCreate && <button className="btn-primary" onClick={() => { setIsNew(true); setEditing({ ...defaults }); setMsg(null); }}>+ إضافة</button>}
      </div>
      {hint && <p className="mt-2 text-sm text-forest/60">{hint}</p>}
      {msg && <p role={msg.type === "error" ? "alert" : "status"} className={`mt-4 rounded-xl p-3 text-sm ${msg.type === "error" ? "bg-red-50 text-red-800" : "bg-sage-200 text-forest"}`}>{msg.text}</p>}

      {editing && (
        <form onSubmit={save} className="card mt-6 grid gap-4 p-6 md:grid-cols-2">
          {fields.map((f) => {
            const id = `f-${f.name}`;
            const common = { id, className: "input", disabled: !isNew && f.readOnlyOnEdit, dir: f.ltr ? "ltr" : undefined } as const;
            const val = editing[f.name] ?? "";
            const set = (v: any) => setEditing({ ...editing, [f.name]: v });
            return (
              <div key={f.name} className={f.type === "textarea" ? "md:col-span-2" : ""}>
                {f.type === "checkbox" ? (
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!editing[f.name]} onChange={(e) => set(e.target.checked)} /> {f.label}</label>
                ) : (
                  <>
                    <label className="label" htmlFor={id}>{f.label}{f.required && " *"}</label>
                    {f.type === "textarea" ? <textarea {...common} rows={3} value={val} onChange={(e) => set(e.target.value)} />
                      : f.type === "select" ? <select {...common} value={val} onChange={(e) => set(e.target.value)}><option value="">—</option>{f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
                      : f.type === "datetime" ? <input {...common} type="datetime-local" value={toLocal(editing[f.name])} onChange={(e) => set(e.target.value)} />
                      : <input {...common} type={f.type === "number" ? "number" : "text"} step={f.type === "number" ? "any" : undefined} value={val} onChange={(e) => set(e.target.value)} />}
                  </>
                )}
              </div>
            );
          })}
          <div className="flex gap-2 md:col-span-2"><button className="btn-primary">حفظ</button><button type="button" className="btn-outline" onClick={() => setEditing(null)}>إلغاء</button></div>
        </form>
      )}

      <div className="card mt-6 overflow-x-auto">
        {loading ? <p className="p-6" role="status">جارٍ التحميل...</p> : rows.length === 0 ? <p className="p-6 text-forest/60">لا توجد بيانات.</p> : (
          <table className="w-full text-sm">
            <thead className="bg-ivory-200 text-start"><tr>{columns.map((c) => <th key={c} className="p-3 text-start font-semibold">{label(c)}</th>)}<th className="p-3" /></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r[pk]} className="border-t border-beige">
                  {columns.map((c) => <td key={c} className="p-3">{show(r[c])}</td>)}
                  <td className="whitespace-nowrap p-3 text-end">
                    <button className="me-3 underline" onClick={() => { setIsNew(false); setEditing({ ...r }); setMsg(null); }}>تعديل</button>
                    {canDelete && <button className="text-red-700 underline" onClick={() => del(r)}>حذف</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
