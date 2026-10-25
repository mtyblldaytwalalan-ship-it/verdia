import ResourceManager from "@/components/admin/ResourceManager";

export default function Page() {
  return (
    <ResourceManager title="أكواد الخصم" table="promotions" pk="id"
      hint="حددي نسبة مئوية أو مبلغًا ثابتًا (أو كليهما). يتم التحقق من الكود على الخادم عند إنشاء الطلب."
      defaults={{ is_active: true, min_subtotal_egp: 0 }}
      columns={["code", "percent_off", "amount_off_egp", "min_subtotal_egp", "is_active"]}
      fields={[
        { name: "code", label: "الكود", required: true, ltr: true },
        { name: "percent_off", label: "نسبة الخصم %", type: "number" },
        { name: "amount_off_egp", label: "خصم ثابت (ج.م)", type: "number" },
        { name: "min_subtotal_egp", label: "الحد الأدنى للطلب (ج.م)", type: "number" },
        { name: "expires_at", label: "ينتهي في", type: "datetime" },
        { name: "is_active", label: "مفعّل", type: "checkbox" },
      ]} />
  );
}
