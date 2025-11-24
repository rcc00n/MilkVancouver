import type { BlogPost, BlogPostDetail, PaginatedResponse } from "../types";
import api from "./client";

export type BlogListQuery = {
  page?: number;
  page_size?: number;
};

export async function getBlogPosts(
  params?: BlogListQuery,
  signal?: AbortSignal,
): Promise<PaginatedResponse<BlogPost>> {
  const queryParams = {
    ...(params?.page ? { page: params.page } : {}),
    ...(params?.page_size ? { page_size: params.page_size } : {}),
  };

  const response = await api.get<PaginatedResponse<BlogPost>>("/blog/posts/", {
    params: Object.keys(queryParams).length ? queryParams : undefined,
    signal,
  });
  return response.data;
}

export async function getLatestBlogPosts(limit = 3, signal?: AbortSignal): Promise<BlogPost[]> {
  const response = await getBlogPosts({ page: 1, page_size: limit }, signal);
  return response.results;
}

export async function getBlogPost(slug: string, signal?: AbortSignal): Promise<BlogPostDetail> {
  const response = await api.get<BlogPostDetail>(`/blog/posts/${slug}/`, { signal });
  return response.data;
}
