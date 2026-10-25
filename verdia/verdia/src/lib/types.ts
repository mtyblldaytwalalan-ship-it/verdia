export type Category = { id: string; slug: string; name_ar: string; image_url: string | null };

export type Product = {
  id: string;
  slug: string;
  category_id: string | null;
  name_ar: string;
  description_ar: string | null;
  price_egp: number;
  compare_at_price_egp: number | null;
  stock: number;
  images: string[];
  variants: { name: string; options: string[] }[];
  is_sample: boolean;
};

export type CartLine = { productId: string; slug: string; name: string; price: number; image?: string; quantity: number; variant?: string };

export type ShippingRule = { governorate: string; fee_egp: number; free_over_egp: number | null; is_serviceable: boolean };
