import ResourceManager from "@/components/admin/ResourceManager";

export default function Page() {
  return (
    <ResourceManager title="الشحن ومناطق الخدمة" table="shipping_rules" pk="governorate" canCreate canDelete
      hint="القيم المبدئية مجرد أمثلة. عدّلي الرسوم الفعلية قبل الإطلاق. أوقفي «متاح للتوصيل» لإخفاء محافظة."
      defaults={{ is_serviceable: true, fee_egp: 0 }}
      columns={["governorate", "fee_egp", "free_over_egp", "is_serviceable"]}
      fields={[
        { name: "governorate", label: "المحافظة", required: true, readOnlyOnEdit: true },
        { name: "fee_egp", label: "رسوم الشحن (ج.م)", type: "number", required: true },
        { name: "free_over_egp", label: "شحن مجاني فوق (ج.م) — اختياري", type: "number" },
        { name: "is_serviceable", label: "متاح للتوصيل", type: "checkbox" },
      ]} />
  );
}
