# Verdia — Skin Care Store

Arabic (RTL) e-commerce site: Next.js (App Router) + TypeScript + Tailwind CSS + Supabase (Postgres, Auth, Storage).

> **Status:** the source was written in an environment with no access to the npm registry, so it has **not been installed, type-checked, built or run**. Expect to fix a few small compile errors on first run (`npm run typecheck`). The SQL has not been executed against a real database either.

## What is included

- Storefront: homepage, catalog (search, category/price/stock filters, sorting, pagination), product page (gallery, variants, quantity, related products, reviews, JSON-LD), cart (persisted in localStorage), wishlist, checkout (COD), order confirmation, login/register, account with order history, about/contact/policy pages, sitemap and robots.
- Orders are created by the Postgres function `create_order` (migration 001). Prices, stock, shipping and promo discounts are computed **in the database**; stock rows are locked to prevent overselling. If it fails, the checkout shows an error and never a success page.
- Admin (`/admin`): stats, orders + status updates, products (image upload to Supabase Storage), categories, shipping rules, banners, promo codes, reviews, store settings. Access is enforced in middleware, in the admin layout, and by Row Level Security (`is_admin()`).
- Contact details and social links are empty until the owner fills them in under **Admin → إعدادات المتجر**. Banners and discount badges only appear once activated in the admin.

## Run locally

1. `npm install`
2. Create a project at supabase.com. In the SQL editor run, in order: `supabase/migrations/001_schema.sql`, `002_seed.sql` (sample data, optional), `003_restock.sql`.
3. `cp .env.example .env.local` and fill in the three Supabase values (Project Settings → API).
4. In Supabase → Authentication → Providers, keep Email enabled. For quick testing you may disable "Confirm email".
5. `npm run dev` and open http://localhost:3000, then register an account.
6. Make yourself admin (SQL editor): `update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'YOUR@EMAIL');`
7. Visit `/admin`.

## Deploy (Vercel)

1. Push the repo to GitHub and import it in Vercel.
2. Add the environment variables from `.env.example` (set `NEXT_PUBLIC_SITE_URL` to your domain).
3. In Supabase → Authentication → URL Configuration, set the Site URL and add your domain to Redirect URLs.
4. Deploy, then attach your custom domain.

## Still required before launch

- **Photography:** no product, hero or category images are bundled. Upload product images in the admin; set image URLs for categories and the hero/promo banners (upload to the `product-images` bucket and paste the public URL). Use only images you own or are licensed to use.
- **Real data:** replace the sample products (flagged "عينة"), set real shipping fees, and fill in contact info and social links.
- **Policies:** the shipping, returns, privacy and terms pages are placeholders and need your real text. Don't publish claims such as "original", "certified" or "dermatologist-approved" unless you can prove them.
- **Online payments:** not implemented. Only cash on delivery works (`payment_method` is constrained to `cod`). Adding cards needs a provider such as Paymob or Stripe with a server-side webhook; card details must never touch this app. The `cod_enabled` setting is stored but not yet enforced in checkout.
- **Not built:** customers submitting reviews from the product page (reviews table, moderation and display exist), saved addresses UI, newsletter export, email/SMS order notifications, password reset page, rate limiting on checkout (add Cloudflare/Vercel protections), automated tests.
- **Security review:** have the RLS policies reviewed before taking real orders. Note guests can read an order only with its number **and** phone via `get_order`.
