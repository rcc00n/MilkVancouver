import api from "./client";

import type { SiteImageMap } from "../types/content";

export async function getSiteImages(signal?: AbortSignal): Promise<SiteImageMap> {
  const response = await api.get<SiteImageMap>("/site-images/", { signal });
  return response.data || {};
}
