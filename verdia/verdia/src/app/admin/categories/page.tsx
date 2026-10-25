import ResourceManager from "@/components/admin/ResourceManager";

export default function Page() {
  return (
    <ResourceManager title="التصنيفات" table="categories" pk="id" orderBy="sort_order"
      defaults={{ is_active: true, sort_order: 0 }}
      columns={["name_ar", "slug", "sort_order", "is_active"]}
      fields={[
        { name: "name_ar", label: "الاسم", required: true },
        { name: "slug", label: "الرابط (إنجليزي بدون مسافات)", required: true, ltr: true },
        { name: "image_url", label: "رابط الصورة", ltr: true },
        { name: "sort_order", label: "الترتيب", type: "number" },
        { name: "is_active", label: "ظاهر في المتجر", type: "checkbox" },
      ]} />
  );
}
