import type { Endpoint, Route } from "@citrusworx/seltzer";

type ApiDefinition = {
    method: string;
    endpoint: string;
};

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

async function requestWordPress(ctx: Endpoint, init?: RequestInit) {
    const response = await fetch(ctx.endpoint, init);

    if (!response.ok) {
        throw new Error(`WordPress request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

function createUserRoute(config: ApiDefinition, init?: RequestInit): Route<Endpoint> {
    return {
        method: config.method,
        path: config.endpoint,
        handler: async (ctx: Endpoint) => requestWordPress(ctx, init)
    };
}

export const getAllUsers = createUserRoute(routes.allUsers);

export const getUserById = createUserRoute(routes.usersById);

export const getUserByEmail: Route<Endpoint> = {
    method: routes.usersByEmail.method,
    path: routes.usersByEmail.endpoint,
    handler: async (ctx: Endpoint) => {
        const email = decodeURIComponent(ctx.path.split("/").pop() ?? "");
        const baseUrl = ctx.options?.baseUrl ?? "";
        const endpoint = `${baseUrl}/users?email=${encodeURIComponent(email)}`;

        return requestWordPress({
            ...ctx,
            endpoint
        });
    }
};

export const getUsersByCity = createUserRoute(routes.usersByCity);

export const getUsersByCityState = createUserRoute(routes.usersByCityState);

export const createUser = createUserRoute(routes.createUser, {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    }
});

export const updateUser = createUserRoute(routes.updateUser, {
    method: "PUT",
    headers: {
        "Content-Type": "application/json"
    }
});

export const deleteUser = createUserRoute(routes.deleteUser, {
    method: "DELETE"
});
