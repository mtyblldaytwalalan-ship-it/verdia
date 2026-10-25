-- Verdia schema. Run in the Supabase SQL editor (or `supabase db push`).
create extension if not exists "pgcrypto";

-- ---------- profiles & roles ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer','admin')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name) values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- catalog ----------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_ar text not null,
  image_url text,
  sort_order int not null default 0,
  is_active boolean not null default true
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  category_id uuid references public.categories(id) on delete set null,
  name_ar text not null,
  description_ar text,
  price_egp numeric(10,2) not null check (price_egp >= 0),
  compare_at_price_egp numeric(10,2) check (compare_at_price_egp is null or compare_at_price_egp >= price_egp),
  stock int not null default 0 check (stock >= 0),
  images text[] not null default '{}',
  variants jsonb not null default '[]',      -- e.g. [{"name":"الحجم","options":["50 مل","100 مل"]}]
  is_sample boolean not null default true,   -- sample data until the owner replaces it
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index on public.products (category_id);

-- ---------- customers / addresses ----------
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null,
  phone text not null,
  governorate text not null,
  city text not null,
  address_line text not null,
  created_at timestamptz not null default now()
);

create table public.wishlist (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  primary key (user_id, product_id)
);

-- ---------- shipping & promotions ----------
create table public.shipping_rules (
  governorate text primary key,
  fee_egp numeric(10,2) not null check (fee_egp >= 0),
  free_over_egp numeric(10,2),
  is_serviceable boolean not null default true
);

create table public.promotions (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  percent_off numeric(5,2) check (percent_off between 0 and 100),
  amount_off_egp numeric(10,2) check (amount_off_egp >= 0),
  min_subtotal_egp numeric(10,2) not null default 0,
  expires_at timestamptz,
  is_active boolean not null default true,
  check (percent_off is not null or amount_off_egp is not null)
);

create table public.banners (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'promo' check (kind in ('hero','promo')),
  title_ar text not null,
  subtitle_ar text,
  badge_text text,           -- e.g. "خصم حتى 30%" — only shown when set by admin
  image_url text,
  link_url text default '/products',
  is_active boolean not null default false,
  sort_order int not null default 0
);

create table public.store_settings (
  key text primary key,
  value text
);
-- Contact info is intentionally empty: the owner fills it in from the admin panel.
insert into public.store_settings (key, value) values
  ('phone',''),('email',''),('address',''),
  ('facebook',''),('instagram',''),('tiktok',''),('whatsapp',''),
  ('cod_enabled','true');

-- ---------- orders ----------
create sequence public.order_number_seq start 1001;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  phone text not null,
  governorate text not null,
  city text not null,
  address_line text not null,
  notes text,
  payment_method text not null default 'cod' check (payment_method in ('cod')),
  status text not null default 'pending'
    check (status in ('pending','confirmed','shipped','delivered','cancelled')),
  subtotal_egp numeric(10,2) not null,
  shipping_egp numeric(10,2) not null,
  discount_egp numeric(10,2) not null default 0,
  total_egp numeric(10,2) not null,
  promo_code text,
  created_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name_ar text not null,
  unit_price_egp numeric(10,2) not null,
  quantity int not null check (quantity > 0),
  variant text
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  body text,
  is_approved boolean not null default false,
  created_at timestamptz not null default now(),
  unique (product_id, user_id)
);

create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  consent boolean not null check (consent = true),
  created_at timestamptz not null default now()
);

-- ---------- secure order creation ----------
-- Prices, stock, shipping and discounts are all computed server-side here;
-- the client only sends product ids and quantities.
create or replace function public.create_order(
  p_items jsonb,            -- [{"product_id":"...","quantity":2,"variant":"50 مل"}]
  p_name text, p_phone text, p_governorate text, p_city text, p_address text,
  p_notes text default null, p_promo text default null
) returns table (order_id uuid, order_number text)
language plpgsql security definer set search_path = public as $$
declare
  v_item jsonb; v_prod public.products%rowtype;
  v_qty int; v_subtotal numeric := 0; v_ship numeric := 0; v_disc numeric := 0;
  v_rule public.shipping_rules%rowtype; v_promo public.promotions%rowtype;
  v_order_id uuid := gen_random_uuid(); v_number text;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'السلة فارغة';
  end if;
  if length(trim(p_name)) < 2 or p_phone !~ '^01[0125][0-9]{8}$' then
    raise exception 'بيانات العميل غير صحيحة';
  end if;

  select * into v_rule from public.shipping_rules where governorate = p_governorate and is_serviceable;
  if not found then raise exception 'التوصيل غير متاح لهذه المحافظة'; end if;

  v_number := 'VD-' || nextval('public.order_number_seq');
  insert into public.orders (id, order_number, user_id, customer_name, phone, governorate, city,
    address_line, notes, subtotal_egp, shipping_egp, discount_egp, total_egp)
  values (v_order_id, v_number, auth.uid(), trim(p_name), p_phone, p_governorate, trim(p_city),
    trim(p_address), p_notes, 0, 0, 0, 0);

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::int;
    if v_qty is null or v_qty < 1 then raise exception 'كمية غير صحيحة'; end if;
    -- lock the row so concurrent orders cannot oversell
    select * into v_prod from public.products
      where id = (v_item->>'product_id')::uuid and is_active for update;
    if not found then raise exception 'منتج غير متاح'; end if;
    if v_prod.stock < v_qty then raise exception 'الكمية المطلوبة غير متوفرة: %', v_prod.name_ar; end if;
    update public.products set stock = stock - v_qty where id = v_prod.id;
    insert into public.order_items (order_id, product_id, name_ar, unit_price_egp, quantity, variant)
      values (v_order_id, v_prod.id, v_prod.name_ar, v_prod.price_egp, v_qty, v_item->>'variant');
    v_subtotal := v_subtotal + v_prod.price_egp * v_qty;
  end loop;

  if p_promo is not null and length(trim(p_promo)) > 0 then
    select * into v_promo from public.promotions
      where upper(code) = upper(trim(p_promo)) and is_active
        and (expires_at is null or expires_at > now()) and v_subtotal >= min_subtotal_egp;
    if not found then raise exception 'كود الخصم غير صالح'; end if;
    v_disc := least(v_subtotal, coalesce(v_subtotal * v_promo.percent_off / 100, 0) + coalesce(v_promo.amount_off_egp, 0));
  end if;

  v_ship := case when v_rule.free_over_egp is not null and v_subtotal >= v_rule.free_over_egp
                 then 0 else v_rule.fee_egp end;

  update public.orders set subtotal_egp = v_subtotal, shipping_egp = v_ship, discount_egp = v_disc,
    total_egp = v_subtotal - v_disc + v_ship, promo_code = nullif(trim(p_promo), '')
  where id = v_order_id;

  return query select v_order_id, v_number;
end $$;

-- Public order lookup by number + phone (for the confirmation page, no account needed).
create or replace function public.get_order(p_number text, p_phone text)
returns jsonb language sql security definer set search_path = public as $$
  select jsonb_build_object('order', to_jsonb(o),
    'items', coalesce((select jsonb_agg(to_jsonb(i)) from public.order_items i where i.order_id = o.id), '[]'))
  from public.orders o where o.order_number = p_number and o.phone = p_phone;
$$;

revoke all on function public.create_order from public;
grant execute on function public.create_order to anon, authenticated;
grant execute on function public.get_order to anon, authenticated;

-- ---------- Row Level Security ----------
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.addresses enable row level security;
alter table public.wishlist enable row level security;
alter table public.shipping_rules enable row level security;
alter table public.promotions enable row level security;
alter table public.banners enable row level security;
alter table public.store_settings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reviews enable row level security;
alter table public.newsletter_subscribers enable row level security;

-- profiles: users read/update their own row but cannot change their role
create policy profiles_read on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy profiles_update on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

-- public read of storefront data
create policy categories_read on public.categories for select using (is_active or public.is_admin());
create policy products_read on public.products for select using (is_active or public.is_admin());
create policy banners_read on public.banners for select using (is_active or public.is_admin());
create policy settings_read on public.store_settings for select using (key <> 'service_secret');
create policy shipping_read on public.shipping_rules for select using (true);
create policy reviews_read on public.reviews for select using (is_approved or user_id = auth.uid() or public.is_admin());

-- admin full access
create policy categories_admin on public.categories for all using (public.is_admin()) with check (public.is_admin());
create policy products_admin on public.products for all using (public.is_admin()) with check (public.is_admin());
create policy banners_admin on public.banners for all using (public.is_admin()) with check (public.is_admin());
create policy settings_admin on public.store_settings for all using (public.is_admin()) with check (public.is_admin());
create policy shipping_admin on public.shipping_rules for all using (public.is_admin()) with check (public.is_admin());
create policy promotions_admin on public.promotions for all using (public.is_admin()) with check (public.is_admin());
create policy reviews_admin on public.reviews for all using (public.is_admin()) with check (public.is_admin());
create policy orders_admin on public.orders for all using (public.is_admin()) with check (public.is_admin());
create policy order_items_admin on public.order_items for all using (public.is_admin()) with check (public.is_admin());
create policy newsletter_admin on public.newsletter_subscribers for select using (public.is_admin());

-- customers: own data only
create policy addresses_own on public.addresses for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy wishlist_own on public.wishlist for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy orders_own on public.orders for select using (user_id = auth.uid());
create policy order_items_own on public.order_items for select
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy reviews_insert on public.reviews for insert with check (user_id = auth.uid() and is_approved = false);
create policy newsletter_insert on public.newsletter_subscribers for insert with check (consent = true);

-- ---------- storage bucket for product images ----------
insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true)
  on conflict (id) do nothing;
create policy product_images_read on storage.objects for select using (bucket_id = 'product-images');
create policy product_images_admin on storage.objects for all
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());
