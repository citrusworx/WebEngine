import { gatewayFetch } from "../../../api";
import { asTypeDefinition, readTypeList, type TypeDefinition, type TypePayload } from "./model";

type GatewayErrorBody = {
    error?: string;
};

async function readJson(response: Response): Promise<unknown> {
    const text = await response.text();
    if (!text) {
        return {};
    }

    try {
        return JSON.parse(text) as unknown;
    } catch {
        throw new Error(text || `Unexpected response (${response.status}).`);
    }
}

function errorMessage(payload: unknown, fallback: string): string {
    if (payload && typeof payload === "object" && "error" in payload) {
        const message = (payload as GatewayErrorBody).error;
        if (typeof message === "string" && message.trim()) {
            return message;
        }
    }

    return fallback;
}

function typesPath(slug?: string): string {
    return slug ? `/__kiwipress/types/${encodeURIComponent(slug)}` : "/__kiwipress/types";
}

export async function listTypes(): Promise<TypeDefinition[]> {
    const response = await gatewayFetch(typesPath());
    const payload = await readJson(response);

    if (!response.ok) {
        throw new Error(errorMessage(payload, "Unable to load types."));
    }

    return readTypeList(payload);
}

export async function getType(slug: string): Promise<TypeDefinition> {
    const response = await gatewayFetch(typesPath(slug));
    const payload = await readJson(response);

    if (!response.ok) {
        throw new Error(errorMessage(payload, `Unable to load type "${slug}".`));
    }

    const definition = asTypeDefinition(payload);
    if (!definition) {
        throw new Error(`Type "${slug}" was not found.`);
    }

    return definition;
}

export async function createType(body: TypePayload): Promise<TypeDefinition> {
    const response = await gatewayFetch(typesPath(), {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });
    const payload = await readJson(response);

    if (!response.ok) {
        throw new Error(errorMessage(payload, "Unable to create type."));
    }

    const definition = asTypeDefinition(payload);
    if (!definition) {
        throw new Error("Gateway returned an invalid type definition.");
    }

    return definition;
}

export async function updateType(slug: string, body: Partial<TypePayload>): Promise<TypeDefinition> {
    const response = await gatewayFetch(typesPath(slug), {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });
    const payload = await readJson(response);

    if (!response.ok) {
        throw new Error(errorMessage(payload, `Unable to update type "${slug}".`));
    }

    const definition = asTypeDefinition(payload);
    if (!definition) {
        throw new Error("Gateway returned an invalid type definition.");
    }

    return definition;
}

export async function deleteType(slug: string): Promise<void> {
    const response = await gatewayFetch(typesPath(slug), {
        method: "DELETE"
    });
    const payload = await readJson(response);

    if (!response.ok) {
        throw new Error(errorMessage(payload, `Unable to delete type "${slug}".`));
    }
}
