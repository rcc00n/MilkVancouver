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

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  author?: string;
  excerpt?: string;
  cover_image_url?: string;
  published_at?: string;
}

export interface BlogPostDetail extends BlogPost {
  content: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
