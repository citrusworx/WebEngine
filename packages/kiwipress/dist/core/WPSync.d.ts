import { Categories } from "../categories/categories.js";
import { Comments } from "../comments/comments.js";
import { NectarineStore } from "../cms/store.js";
import type { CmsCollection, TransferPreview, TransferResult } from "../cms/types.js";
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
};
export declare class WPSync {
    private readonly wordpress;
    private readonly store;
    private readonly sourceUrl?;
    constructor(wordpress: WordPressClients, store: NectarineStore, sourceUrl?: string | undefined);
    preview(collections?: CmsCollection[]): Promise<TransferPreview>;
    transfer(collections?: CmsCollection[]): Promise<TransferResult>;
    private readCollection;
    private loadRaw;
}
