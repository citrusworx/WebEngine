function gatewayHeaders(init?: HeadersInit): Headers {
    const headers = new Headers(init);
    const token = import.meta.env.VITE_KIWIPRESS_GATEWAY_TOKEN;

    if (typeof token === "string" && token.trim()) {
        headers.set("Authorization", `Bearer ${token.trim()}`);
    }

    return headers;
}

export function gatewayFetch(input: string, init: RequestInit = {}): Promise<Response> {
    return fetch(input, {
        ...init,
        headers: gatewayHeaders(init.headers)
    });
}
