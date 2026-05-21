export const client = {
    get: async (endpoint) => {
        const url = endpoint.options?.baseUrl
            ? `${endpoint.options.baseUrl}${endpoint.path}`
            : endpoint.path;
        return await fetch(url, {
            method: "GET",
            headers: endpoint.options?.headers,
            // For self-signed certificates, you would need to set up an https agent with the appropriate options.
        }).then((res) => res.json());
    },
    post: async (endpoint, data) => {
        const url = endpoint.options?.baseUrl
            ? `${endpoint.options.baseUrl}${endpoint.path}`
            : endpoint.path;
        return await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...endpoint.options?.headers
            },
            body: JSON.stringify(data)
        }).then((res) => res.json());
    },
    put: async (endpoint, data) => {
        const url = endpoint.options?.baseUrl
            ? `${endpoint.options.baseUrl}${endpoint.path}`
            : endpoint.path;
        return await fetch(url, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                ...endpoint.options?.headers
            },
            body: JSON.stringify(data)
        }).then((res) => res.json());
    },
    patch: async (endpoint, data) => {
        const url = endpoint.options?.baseUrl
            ? `${endpoint.options.baseUrl}${endpoint.path}`
            : endpoint.path;
        return await fetch(url, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                ...endpoint.options?.headers
            },
            body: JSON.stringify(data)
        }).then((res) => res.json());
    },
    delete: async (endpoint) => {
        const url = endpoint.options?.baseUrl
            ? `${endpoint.options.baseUrl}${endpoint.path}`
            : endpoint.path;
        return await fetch(url, {
            method: "DELETE",
            headers: endpoint.options?.headers,
        }).then((res) => res.json());
    }
};
//# sourceMappingURL=client.js.map