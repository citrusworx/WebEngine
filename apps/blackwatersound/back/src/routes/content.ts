import type { Route } from "@citrusworx/seltzer";
import { SEED_LESSON, SEED_POST } from "../context.js";
import { resolveFeaturedImage } from "../lib/wordpress-media.js";
import type { WordPressPage, WordPressPost } from "../types/wordpress.js";
import type { BlackwaterContext } from "../types/context.js";

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, "").trim();
}

function asPost(value: unknown): WordPressPost | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  return value as WordPressPost;
}

function asPage(value: unknown): WordPressPage | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  return value as WordPressPage;
}

export const getPostBySlugRoute: Route<BlackwaterContext> = {
  method: "GET",
  path: "/api/posts/:slug",
  handler: async ({ locals, params, json }) => {
    const slug = params.slug || SEED_POST.slug;

    if (locals.postsClient) {
      try {
        const raw = await locals.postsClient.getBySlug(slug);
        const post = asPost(raw);
        if (post) {
          const heroImage = locals.wpUrl
            ? await resolveFeaturedImage(post, locals.wpUrl, SEED_POST.heroImage)
            : SEED_POST.heroImage;

          json({
            slug: post.slug ?? slug,
            title: stripHtml(post.title?.rendered ?? SEED_POST.title),
            excerpt: stripHtml(post.excerpt?.rendered ?? SEED_POST.excerpt),
            heroImage,
            intro: SEED_POST.intro,
            sections: SEED_POST.sections,
          });
          return;
        }
      } catch {
        // fall through to seed content
      }
    }

    json({ ...SEED_POST, slug });
  },
};

export const getLessonRoute: Route<BlackwaterContext> = {
  method: "GET",
  path: "/api/lessons/:id",
  handler: async ({ locals, params, json }) => {
    const id = params.id || SEED_LESSON.id;

    if (locals.pagesClient) {
      try {
        const raw = await locals.pagesClient.getBySlug(id);
        const page = asPage(raw);
        if (page) {
          const heroImage = locals.wpUrl
            ? await resolveFeaturedImage(page, locals.wpUrl, SEED_LESSON.heroImage)
            : SEED_LESSON.heroImage;

          json({
            ...SEED_LESSON,
            id,
            slug: page.slug ?? id,
            title: stripHtml(page.title?.rendered ?? SEED_LESSON.title),
            summary: stripHtml(page.excerpt?.rendered ?? SEED_LESSON.summary),
            heroImage,
          });
          return;
        }
      } catch {
        // fall through to seed content
      }
    }

    json({ ...SEED_LESSON, id });
  },
};
