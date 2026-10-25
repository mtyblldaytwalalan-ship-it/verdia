-- Sample data. Every product is flagged is_sample = true and shown as "عينة" in the UI.
-- Replace or delete from the admin dashboard before launch.
insert into public.categories (slug, name_ar, sort_order) values
  ('creams','كريمات البشرة',1),
  ('serums','السيروم والعلاجات',2),
  ('cleansers','غسول البشرة',3),
  ('sunscreen','واقي الشمس',4),
  ('masks','أقنعة العناية',5),
  ('makeup','مستحضرات التجميل',6);

insert into public.products (slug, category_id, name_ar, description_ar, price_egp, compare_at_price_egp, stock, is_sample)
select 'sample-cleanser', id, 'غسول للبشرة الدهنية (عينة)', 'منتج تجريبي. استبدليه من لوحة التحكم.', 185, null, 25, true from public.categories where slug='cleansers'
union all select 'sample-serum', id, 'سيروم ترطيب (عينة)', 'منتج تجريبي. استبدليه من لوحة التحكم.', 320, null, 12, true from public.categories where slug='serums'
union all select 'sample-cream', id, 'كريم مرطب للوجه والجسم (عينة)', 'منتج تجريبي. استبدليه من لوحة التحكم.', 210, null, 40, true from public.categories where slug='creams'
union all select 'sample-sunscreen', id, 'واقي شمس للبشرة الحساسة (عينة)', 'منتج تجريبي. استبدليه من لوحة التحكم.', 395, 495, 8, true from public.categories where slug='sunscreen'
union all select 'sample-mask', id, 'قناع ليلي مرطب (عينة)', 'منتج تجريبي. استبدليه من لوحة التحكم.', 280, null, 0, true from public.categories where slug='masks';

-- Shipping fees are placeholders; set real rates in the admin panel.
insert into public.shipping_rules (governorate, fee_egp, free_over_egp) values
  ('القاهرة',50,1500),('الجيزة',50,1500),('الإسكندرية',60,1500),('القليوبية',55,1500),
  ('الدقهلية',70,1500),('الشرقية',70,1500),('الغربية',70,1500),('المنوفية',70,1500),
  ('البحيرة',70,1500),('الفيوم',75,1500),('بني سويف',75,1500),('المنيا',80,1500),
  ('أسيوط',85,1500),('سوهاج',90,1500),('قنا',95,1500),('الأقصر',95,1500),('أسوان',100,1500),
  ('بورسعيد',70,1500),('الإسماعيلية',70,1500),('السويس',70,1500),('دمياط',70,1500),
  ('كفر الشيخ',70,1500),('مطروح',100,1500),('البحر الأحمر',100,1500),
  ('شمال سيناء',110,1500),('جنوب سيناء',110,1500),('الوادي الجديد',120,1500);

-- After creating your own account, promote it to admin:
--   update public.profiles set role = 'admin' where id = '<your auth.users id>';
