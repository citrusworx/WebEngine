import type { Endpoint, Route } from "@citrusworx/seltzer";
import type { ApiDefinition } from "../types/api";
import {
    createAliasedQueryRoute,
    createWordPressRoute
} from "../core/route-utils";

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


export const getAllPosts = createWordPressRoute(routes.allPosts);

export const getPostById = createWordPressRoute(routes.postById);

export const getPostBySlug = createAliasedQueryRoute(routes.postBySlug, "posts", "slug");

export const getPostByAuthor = createAliasedQueryRoute(routes.postByAuthor, "posts", "author");

export const getPostsByTag = createAliasedQueryRoute(routes.postsByTag, "posts", "tags");

export const getPostsByCategory = createAliasedQueryRoute(routes.postsByCategory, "posts", "categories");

export const getPostsByDate = createAliasedQueryRoute(routes.postsByDate, "posts", "after");

export const createPost = createWordPressRoute(routes.createPost, {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    }
});

export const updatePost = createWordPressRoute(routes.updatePost, {
    method: "PUT",
    headers: {
        "Content-Type": "application/json"
    }
});

export const deletePost = createWordPressRoute(routes.deletePost, {
    method: "DELETE"
});
