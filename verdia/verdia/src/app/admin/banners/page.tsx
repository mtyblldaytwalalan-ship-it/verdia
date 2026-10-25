import ResourceManager from "@/components/admin/ResourceManager";

export default function Page() {
  return (
    <ResourceManager title="البانرات الترويجية" table="banners" pk="id" orderBy="sort_order"
      hint="لا يظهر أي بانر أو خصم في المتجر إلا بعد تفعيله هنا. لا تكتبي نسبة خصم إلا إذا كانت حقيقية."
      defaults={{ kind: "promo", is_active: false, sort_order: 0, link_url: "/products" }}
      columns={["title_ar", "kind", "badge_text", "is_active"]}
      fields={[
        { name: "kind", label: "النوع", type: "select", required: true, options: [{ value: "hero", label: "الواجهة الرئيسية" }, { value: "promo", label: "ترويجي" }] },
        { name: "title_ar", label: "العنوان", required: true },
        { name: "subtitle_ar", label: "النص الداعم" },
        { name: "badge_text", label: "شارة الخصم (مثال: خصم حتى 30%)" },
        { name: "image_url", label: "رابط الصورة", ltr: true },
        { name: "link_url", label: "رابط الزر", ltr: true },
        { name: "sort_order", label: "الترتيب", type: "number" },
        { name: "is_active", label: "مفعّل", type: "checkbox" },
      ]} />
  );
}
