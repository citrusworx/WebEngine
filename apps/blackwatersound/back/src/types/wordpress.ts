export type WordPressRenderedField = {
  rendered?: string;
};

export type WordPressFeaturedMediaFields = {
  featured_media?: number;
  featured_media_url?: string;
};

export type WordPressPost = WordPressFeaturedMediaFields & {
  slug?: string;
  title?: WordPressRenderedField;
  excerpt?: WordPressRenderedField;
  content?: WordPressRenderedField;
};

export type WordPressPage = WordPressFeaturedMediaFields & {
  slug?: string;
  title?: WordPressRenderedField;
  excerpt?: WordPressRenderedField;
  content?: WordPressRenderedField;
};
