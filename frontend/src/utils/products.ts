import type { Product } from "../types";

const FALLBACK_IMAGE = "https://placehold.co/600x400?text=MeatDirect";

export function getProductImageUrl(product: Product): string {
  return product.main_image_url || product.images[0]?.image_url || FALLBACK_IMAGE;
}
