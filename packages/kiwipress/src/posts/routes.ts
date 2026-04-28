import type { Endpoint, Route } from "@citrusworx/seltzer";
import type { ApiDefinition } from "../types/api";

type CleanPostRoutes = {
    allPosts: ApiDefinition;
    postById: ApiDefinition;
    postBySlug: ApiDefinition;
    postByAuthor: ApiDefinition;
    postsByTag: ApiDefinition;
    postsByCategory: ApiDefinition;
    postsByDate: ApiDefinition;
    updatePost: ApiDefinition;
    deletePost: ApiDefinition;
    createPost: ApiDefinition;
}

const routes: CleanPostRoutes = {
    allPosts: {
        method: "GET",
        endpoint: "/posts"
    },
    postById: {
        method: "GET",
        endpoint: "/posts/:id"
    },
    postBySlug: {
        method: "GET",
        endpoint: "/posts/:slug"
    },
    postByAuthor: {
        method: "GET",
        endpoint: "/posts/:author"
    },
    postsByTag: {
        method: "GET",
        endpoint: "/posts/:tag"
    },
    postsByCategory: {
        method: "GET",
        endpoint: "/posts/:category"
    },
    postsByDate: {
        method: "GET",
        endpoint: "/posts/:date"
    },
    updatePost: {
        method: "PUT",
        endpoint: "/posts/:id"
    },
    deletePost: {
        method: "DELETE",
        endpoint: "/posts/:id"
    },
    createPost: {
        method: "POST",
        endpoint: "/posts"
    }
};

async function requestWordPress(ctx: Endpoint, init?: RequestInit) {
    const response = await fetch(ctx.endpoint, init);

    if (!response.ok) {
        throw new Error(`WordPress request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

function createPostRoute(config: ApiDefinition, init?: RequestInit): Route<Endpoint> {
    return {
        method: config.method,
        path: config.endpoint,
        handler: async (ctx: Endpoint) => requestWordPress(ctx, init)
    };
}

function getLastParam(ctx: Endpoint): string {
    return decodeURIComponent(ctx.path.split("/").pop() ?? "");
}

function buildAliasedEndpoint(ctx: Endpoint, query: string): string {
    const baseUrl = ctx.options?.baseUrl ?? "";
    return `${baseUrl}/posts?${query}`;
}

export const getAllPosts = createPostRoute(routes.allPosts);

export const getPostById = createPostRoute(routes.postById);

export const getPostBySlug: Route<Endpoint> = {
    method: routes.postBySlug.method,
    path: routes.postBySlug.endpoint,
    handler: async (ctx: Endpoint) => {
        const slug = getLastParam(ctx);

        return requestWordPress({
            ...ctx,
            endpoint: buildAliasedEndpoint(ctx, `slug=${encodeURIComponent(slug)}`)
        });
    }
};

export const getPostByAuthor: Route<Endpoint> = {
    method: routes.postByAuthor.method,
    path: routes.postByAuthor.endpoint,
    handler: async (ctx: Endpoint) => {
        const author = getLastParam(ctx);

        return requestWordPress({
            ...ctx,
            endpoint: buildAliasedEndpoint(ctx, `author=${encodeURIComponent(author)}`)
        });
    }
};

export const getPostsByTag: Route<Endpoint> = {
    method: routes.postsByTag.method,
    path: routes.postsByTag.endpoint,
    handler: async (ctx: Endpoint) => {
        const tag = getLastParam(ctx);

        return requestWordPress({
            ...ctx,
            endpoint: buildAliasedEndpoint(ctx, `tags=${encodeURIComponent(tag)}`)
        });
    }
};

export const getPostsByCategory: Route<Endpoint> = {
    method: routes.postsByCategory.method,
    path: routes.postsByCategory.endpoint,
    handler: async (ctx: Endpoint) => {
        const category = getLastParam(ctx);

        return requestWordPress({
            ...ctx,
            endpoint: buildAliasedEndpoint(ctx, `categories=${encodeURIComponent(category)}`)
        });
    }
};

export const getPostsByDate: Route<Endpoint> = {
    method: routes.postsByDate.method,
    path: routes.postsByDate.endpoint,
    handler: async (ctx: Endpoint) => {
        const date = getLastParam(ctx);

        return requestWordPress({
            ...ctx,
            endpoint: buildAliasedEndpoint(ctx, `after=${encodeURIComponent(date)}`)
        });
    }
};

export const createPost = createPostRoute(routes.createPost, {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    }
});

export const updatePost = createPostRoute(routes.updatePost, {
    method: "PUT",
    headers: {
        "Content-Type": "application/json"
    }
});

export const deletePost = createPostRoute(routes.deletePost, {
    method: "DELETE"
});
