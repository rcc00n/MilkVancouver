import { brand } from "../config/brand";

const homeImagesBase = "/images/home";

// Store homepage artwork locally (Dokku-friendly) to avoid hotlink 404s.
const imageLibrary: Record<string, string> = {
  // Flavor cards
  "home.flavor.berry_blast": `${homeImagesBase}/flavors/flavor-berry-blast.jpg`,
  "home.flavor.honey_vanilla": `${homeImagesBase}/flavors/flavor-honey-vanilla.jpg`,
  "home.flavor.chocolate_swirl": `${homeImagesBase}/flavors/flavor-chocolate-swirl.jpg`,
  "home.flavor.tropical_sunrise": `${homeImagesBase}/flavors/flavor-tropical-sunrise.jpg`,
  // Story band
  "home.story.image_1": `${homeImagesBase}/story/story-1.jpg`,
  "home.story.image_2": `${homeImagesBase}/story/story-2.jpg`,
  "home.story.image_3": `${homeImagesBase}/story/story-3.jpg`,
  // Community strip
  "home.community_1": `${homeImagesBase}/community/community-1.jpg`,
  "home.community_2": `${homeImagesBase}/community/community-2.jpg`,
  "home.community_3": `${homeImagesBase}/community/community-3.jpg`,
  "home.community_4": `${homeImagesBase}/community/community-4.jpg`,
  "home.community_5": `${homeImagesBase}/community/community-5.jpg`,
  "home.community_6": `${homeImagesBase}/community/community-6.jpg`,
};

export function getImageSrc(key: string) {
  if (imageLibrary[key]) return imageLibrary[key];
  const placeholderLabel = encodeURIComponent(key || brand.shortName);
  return `https://placehold.co/640x640?text=${placeholderLabel}`;
}

export type ImageKey = keyof typeof imageLibrary | string;
