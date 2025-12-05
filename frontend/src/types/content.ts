export type SiteImageRecord = {
  url: string | null;
  alt: string;
  description: string;
};

export type SiteImageMap = Record<string, SiteImageRecord>;
