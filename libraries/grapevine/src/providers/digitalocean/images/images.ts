import { parseYAML } from "../../../infrastructure/util/utilities.js";
import { doRequest } from "../client.js";
import { cleanPayload } from "../utilities.js";

export interface ImageSpec {
    name: string;
    url?: string;
    region?: string;
    distribution?: string;
    description?: string;
    tags?: string[];
}

export interface ImageBlueprint {
    name?: string;
    distribution?: string;
    blueprint: {
        name: string;
        image: ImageSpec;
    };
}

export interface ImageResource {
    id: number;
    name: string;
    type?: string;
    distribution?: string;
    slug?: string | null;
    public?: boolean;
    regions?: string[];
    created_at?: string;
    min_disk_size?: number;
    size_gigabytes?: number;
    description?: string;
    tags?: string[];
    status?: string;
}

export async function listAllImages(
    query: { type?: string; private?: boolean; tag_name?: string; per_page?: number; page?: number } = {}
): Promise<ImageResource[]> {
    const response = await doRequest<{ images: ImageResource[] }>({
        method: "GET",
        url: "/images",
        params: cleanPayload(query)
    });
    return response.images;
}

export async function createCustomImage(schematic: string | ImageSpec): Promise<ImageResource> {
    const payload =
        typeof schematic === "string"
            ? cleanPayload(parseYAML<ImageBlueprint>(schematic).blueprint.image)
            : cleanPayload(schematic);
    const response = await doRequest<{ image: ImageResource }>({
        method: "POST",
        url: "/images",
        data: payload
    });
    return response.image;
}

export async function listExistingImage(imageId: string | number): Promise<ImageResource> {
    const response = await doRequest<{ image: ImageResource }>({
        method: "GET",
        url: `/images/${imageId}`
    });
    return response.image;
}

export async function updateImage(
    imageId: string | number,
    blueprint: Partial<ImageSpec>
): Promise<ImageResource> {
    const response = await doRequest<{ image: ImageResource }>({
        method: "PUT",
        url: `/images/${imageId}`,
        data: cleanPayload(blueprint)
    });
    return response.image;
}

export async function deleteImage(imageId: string | number): Promise<void> {
    await doRequest<void>({
        method: "DELETE",
        url: `/images/${imageId}`
    });
}
