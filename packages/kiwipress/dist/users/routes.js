import { createAliasedQueryRoute, createAliasedQueryRouteFromKeys, createWordPressRoute } from "../core/route-utils.js";
const routes = {
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
export const getUsersByCity = createAliasedQueryRoute(routes.usersByCity, "users", "city");
export const getUsersByCityState = createAliasedQueryRouteFromKeys(routes.usersByCityState, "users", ["state", "city"]);
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
//# sourceMappingURL=routes.js.map