export interface ProductImage {
  id: number;
  image_url: string;
  alt_text: string;
  sort_order: number;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price_cents: number;
  main_image_url?: string;
  category?: string;
  is_popular: boolean;
  images: ProductImage[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}
