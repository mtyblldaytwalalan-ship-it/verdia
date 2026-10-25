import ResourceManager from "@/components/admin/ResourceManager";

export default function Page() {
  return (
    <ResourceManager title="التقييمات" table="reviews" pk="id" orderBy="created_at" canCreate={false}
      hint="لا يظهر التقييم في المتجر إلا بعد الموافقة عليه."
      columns={["rating", "body", "is_approved", "created_at"]}
      fields={[
        { name: "rating", label: "التقييم", type: "number", readOnlyOnEdit: true },
        { name: "body", label: "النص", type: "textarea" },
        { name: "is_approved", label: "موافق عليه", type: "checkbox" },
      ]} />
  );
}
