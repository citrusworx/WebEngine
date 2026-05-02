import type { Endpoint, Route } from "@citrusworx/seltzer";
import type { ApiDefinition } from "../types/api";
import {
    createAliasedQueryRoute,
    createWordPressRoute
} from "../core/route-utils";

type CleanUserRoutes = {
    allUsers: ApiDefinition;
    usersById: ApiDefinition;
    usersByEmail: ApiDefinition;
    usersByCity: ApiDefinition;
    usersByCityState: ApiDefinition;
    createUser: ApiDefinition;
    updateUser: ApiDefinition;
    deleteUser: ApiDefinition;
};

const routes: CleanUserRoutes = {
    allUsers: {
        method: "GET",
        endpoint: "/users"
    },
    usersById: {
        method: "GET",
        endpoint: "/users/:id"
    },
    usersByEmail: {
        method: "GET",
        endpoint: "/users/:email"
    },
    usersByCity: {
        method: "GET",
        endpoint: "/users/:city"
    },
    usersByCityState: {
        method: "GET",
        endpoint: "/users/:state/:city"
    },
    createUser: {
        method: "POST",
        endpoint: "/users"
    },
    updateUser: {
        method: "PUT",
        endpoint: "/users/:id"
    },
    deleteUser: {
        method: "DELETE",
        endpoint: "/users/:id"
    }
};

export const getAllUsers = createWordPressRoute(routes.allUsers);

export const getUserById = createWordPressRoute(routes.usersById);

export const getUserByEmail = createAliasedQueryRoute(routes.usersByEmail, "users", "email");

export const getUsersByCity = createWordPressRoute(routes.usersByCity);

export const getUsersByCityState = createWordPressRoute(routes.usersByCityState);

export const createUser = createWordPressRoute(routes.createUser, {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    }
});

export const updateUser = createWordPressRoute(routes.updateUser, {
    method: "PUT",
    headers: {
        "Content-Type": "application/json"
    }
});

export const deleteUser = createWordPressRoute(routes.deleteUser, {
    method: "DELETE"
});
