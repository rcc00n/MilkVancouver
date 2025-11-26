import type { Product } from "../types";
import { brand } from "../config/brand";

const FALLBACK_IMAGE = `https://placehold.co/600x400?text=${encodeURIComponent(brand.shortName)}`;

const resolveAbsoluteUrl = (raw?: string | null) => {
  const url = (raw || "").trim();
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;

  // Handle relative media paths by prefixing with the current origin (works for SSR and browser).
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/${url.replace(/^\/+/, "")}`;
  }

  return url;
};

export function getProductImageUrl(product: Product): string {
  const fromMain = resolveAbsoluteUrl(product.main_image_url);
  const fromImage = resolveAbsoluteUrl((product as { image_url?: string }).image_url);
  const fromGallery = resolveAbsoluteUrl(product.images[0]?.image_url);

  return fromMain || fromImage || fromGallery || FALLBACK_IMAGE;
}
