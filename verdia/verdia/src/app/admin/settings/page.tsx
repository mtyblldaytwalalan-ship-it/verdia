import ResourceManager from "@/components/admin/ResourceManager";

export default function Page() {
  return (
    <ResourceManager title="إعدادات المتجر" table="store_settings" pk="key" canCreate={false} canDelete={false}
      hint="بيانات التواصل والسوشيال ميديا تظهر في الفوتر وصفحة «تواصل معنا» فقط عند تعبئتها."
      columns={["key", "value"]}
      fields={[
        { name: "key", label: "المفتاح (phone, email, address, facebook, instagram, tiktok, whatsapp, cod_enabled)", readOnlyOnEdit: true, ltr: true },
        { name: "value", label: "القيمة", ltr: true },
      ]} />
  );
}
