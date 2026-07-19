import type { WordPressPage, WordPressPost } from "../types/wordpress.js";

function trimTrailingSlash(url: string) {
  return url.replace(/\/+$/, "");
}

type FeaturedMediaEntity = WordPressPost | WordPressPage;

export async function resolveFeaturedImage(entity: FeaturedMediaEntity, wpUrl: string, fallback: string) {
  if (entity.featured_media_url) {
    return entity.featured_media_url;
  }

  const mediaId = entity.featured_media;
  if (!mediaId) {
    return fallback;
  }

  try {
    const response = await fetch(`${trimTrailingSlash(wpUrl)}/wp-json/wp/v2/media/${mediaId}`);
    if (!response.ok) {
      return fallback;
    }

    const media = (await response.json()) as { source_url?: string };
    return media.source_url ?? fallback;
  } catch {
    return fallback;
  }
}
