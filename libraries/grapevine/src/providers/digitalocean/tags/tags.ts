import { doRequest } from "../client.js";

export interface TagResourceRef {
    resource_id: string;
    resource_type: "droplet" | "image" | "volume" | "volume_snapshot" | "database" | string;
}

export interface TagResources {
    count?: number;
    last_tagged_uri?: string;
    droplets?: { count?: number; last_tagged_uri?: string };
    images?: { count?: number; last_tagged_uri?: string };
    volumes?: { count?: number; last_tagged_uri?: string };
}

export interface Tag {
    name: string;
    resources?: TagResources;
}

export async function listAllTags(): Promise<Tag[]> {
    const response = await doRequest<{ tags: Tag[] }>({
        method: "GET",
        url: "/tags"
    });
    return response.tags;
}

export async function listTag(tag: string): Promise<Tag> {
    const response = await doRequest<{ tag: Tag }>({
        method: "GET",
        url: `/tags/${encodeURIComponent(tag)}`
    });
    return response.tag;
}

export async function createTag(tag: string): Promise<Tag> {
    const response = await doRequest<{ tag: Tag }>({
        method: "POST",
        url: "/tags",
        data: { name: tag }
    });
    return response.tag;
}

export async function tagResource(tag: string, resources: TagResourceRef[]): Promise<void> {
    await doRequest<void>({
        method: "POST",
        url: `/tags/${encodeURIComponent(tag)}/resources`,
        data: { resources }
    });
}

export async function untagResource(tag: string, resources: TagResourceRef[]): Promise<void> {
    await doRequest<void>({
        method: "DELETE",
        url: `/tags/${encodeURIComponent(tag)}/resources`,
        data: { resources }
    });
}

export async function deleteTag(tag: string): Promise<void> {
    await doRequest<void>({
        method: "DELETE",
        url: `/tags/${encodeURIComponent(tag)}`
    });
}
