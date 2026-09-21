import { Categories } from "../categories/categories.js";
import { Comments } from "../comments/comments.js";
import { CustomPostType } from "../cpt/cpt.js";
import { NectarineStore } from "../cms/store.js";
import type { CmsCollection, TransferPreview, TransferResult } from "../cms/types.js";
import type { WPCoreConfig } from "./WPCore.js";
import { Media } from "../media/media.js";
import { Pages } from "../pages/pages.js";
import { Posts } from "../posts/posts.js";
import { Tags } from "../tags/tags.js";
import { Users } from "../users/users.js";
export type WordPressClients = {
    posts: Posts;
    pages: Pages;
    users: Users;
    categories: Categories;
    tags: Tags;
    comments: Comments;
    media: Media;
    cpt(restBase: string): CustomPostType;
};
export declare function createWordPressClients(config: Partial<WPCoreConfig>): WordPressClients;
export declare class WPSync {
    private readonly wordpress;
    private readonly store;
    private readonly sourceUrl?;
    constructor(wordpress: WordPressClients, store: NectarineStore, sourceUrl?: string | undefined);
    preview(collections?: CmsCollection[]): Promise<TransferPreview>;
    transfer(collections?: CmsCollection[]): Promise<TransferResult>;
    private readCollection;
}
