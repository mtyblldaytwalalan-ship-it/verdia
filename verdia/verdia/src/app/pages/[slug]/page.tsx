import { notFound } from "next/navigation";

// Policy page text is a TEMPLATE. The store owner must replace it with their real
// policies (ideally reviewed by a qualified advisor) before launch.
const PAGES: Record<string, { title: string; body: string[] }> = {
  shipping: { title: "الشحن والتوصيل", body: ["نوصّل إلى المحافظات المتاحة في صفحة إتمام الطلب، وتظهر رسوم الشحن قبل تأكيد الطلب.", "مدة التوصيل: يحددها صاحب المتجر."] },
  returns: { title: "الاستبدال والاسترجاع", body: ["سياسة الاستبدال والاسترجاع: يحددها صاحب المتجر."] },
  privacy: { title: "سياسة الخصوصية", body: ["نجمع بيانات الطلب (الاسم والهاتف والعنوان) لتنفيذ طلبك فقط، ولا نخزن بيانات بطاقات الدفع.", "التفاصيل القانونية الكاملة: يحددها صاحب المتجر."] },
  terms: { title: "الشروط والأحكام", body: ["الشروط والأحكام الكاملة: يحددها صاحب المتجر."] },
};

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const page = PAGES[(await params).slug];
  if (!page) notFound();
  return (
    <div className="container-x max-w-3xl py-14">
      <h1 className="font-display text-4xl">{page.title}</h1>
      <div className="mt-6 space-y-4 leading-loose text-forest/85">{page.body.map((p, i) => <p key={i}>{p}</p>)}</div>
      <p className="mt-8 rounded-xl bg-gold/20 p-3 text-xs">نص قالبي مؤقت — يجب استبداله بالسياسة الفعلية للمتجر قبل الإطلاق.</p>
    </div>
  );
}
