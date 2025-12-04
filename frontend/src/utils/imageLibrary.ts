import { brand } from "../config/brand";

const imageLibrary: Record<string, string> = {
  // Flavor cards
  "home.flavor.berry_blast": "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=800&q=80",
  "home.flavor.honey_vanilla": "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80",
  "home.flavor.chocolate_swirl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80",
  "home.flavor.tropical_sunrise": "https://images.unsplash.com/photo-1505250469679-203ad9ced0cb?auto=format&fit=crop&w=800&q=80",
  // Story band
  "home.story.image_1": "https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=1200&q=80",
  "home.story.image_2": "https://images.unsplash.com/photo-1505250469679-203ad9ced0cb?auto=format&fit=crop&w=1200&q=80",
  "home.story.image_3": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80",
  // Community strip
  "home.community_1": "https://images.unsplash.com/photo-1510626176961-4b37d0ae5b2b?auto=format&fit=crop&w=800&q=80",
  "home.community_2": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80",
  "home.community_3": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80",
  "home.community_4": "https://images.unsplash.com/photo-1505250469679-203ad9ced0cb?auto=format&fit=crop&w=800&q=80",
  "home.community_5": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80",
  "home.community_6": "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?auto=format&fit=crop&w=800&q=80",
};

export function getImageSrc(key: string) {
  if (imageLibrary[key]) return imageLibrary[key];
  const placeholderLabel = encodeURIComponent(key || brand.shortName);
  return `https://placehold.co/640x640?text=${placeholderLabel}`;
}

export type ImageKey = keyof typeof imageLibrary | string;
