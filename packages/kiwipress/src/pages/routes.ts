import type { Endpoint, Route } from "@citrusworx/seltzer";
import type { ApiDefinition } from "../types/api";
import {
    createAliasedQueryRoute,
    createWordPressRoute
} from "../core/route-utils";

type CleanPageRoutes = {
    allPages: ApiDefinition;
    pageById: ApiDefinition;
    pageBySlug: ApiDefinition;
    pageByTag: ApiDefinition;
    pageByCategory: ApiDefinition;
    pageByAuthor: ApiDefinition;
    createPage: ApiDefinition;
    updatePage: ApiDefinition;
    deletePage: ApiDefinition;
};

const routes: CleanPageRoutes = {
    allPages: {
        method: 'GET',
        endpoint: '/pages'
    },
    pageById: {
        method: 'GET',
        endpoint: '/pages/:id'
    },
    pageBySlug: {
        method: 'GET',
        endpoint: '/pages/:slug'
    },
    pageByTag: {
        method: 'GET',
        endpoint: '/pages/:tag'
    },
    pageByCategory: {
        method: 'GET',
        endpoint: '/pages/:category'
    },
    pageByAuthor: {
        method: 'GET',
        endpoint: '/pages/:author'
    },
    createPage: {
        method: 'POST',
        endpoint: '/pages'
    },
    updatePage: {
        method: 'PUT',
        endpoint: '/pages/:id'
    },
    deletePage: {
        method: 'DELETE',
        endpoint: '/pages/:id'
    }
};

export const getAllPages = createWordPressRoute(routes.allPages);

export const getPageById = createWordPressRoute(routes.pageById);

export const getPageBySlug = createAliasedQueryRoute(routes.pageBySlug, "pages", "slug");

export const getPageByAuthor = createAliasedQueryRoute(routes.pageByAuthor, "pages", "author");

export const getPageByTag = createAliasedQueryRoute(routes.pageByTag, "pages", "tag");

export const getPageByCategory = createAliasedQueryRoute(routes.pageByCategory, "pages", "category");

export const createPage = createWordPressRoute(routes.createPage, {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    }
});

export const updatePage = createWordPressRoute(routes.updatePage, {
    method: "PUT",
    headers: {
        "Content-Type": "application/json"
    }
});

export const deletePage = createWordPressRoute(routes.deletePage, {
    method: "DELETE"
});
