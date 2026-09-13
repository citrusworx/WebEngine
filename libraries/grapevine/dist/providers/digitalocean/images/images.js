import { parseYAML } from "../../../infrastructure/util/utilities.js";
import { doRequest } from "../client.js";
import { cleanPayload } from "../utilities.js";
export async function listAllImages(query = {}) {
    const response = await doRequest({
        method: "GET",
        url: "/images",
        params: cleanPayload(query)
    });
    return response.images;
}
export async function createCustomImage(schematic) {
    const payload = typeof schematic === "string"
        ? cleanPayload(parseYAML(schematic).blueprint.image)
        : cleanPayload(schematic);
    const response = await doRequest({
        method: "POST",
        url: "/images",
        data: payload
    });
    return response.image;
}
export async function listExistingImage(imageId) {
    const response = await doRequest({
        method: "GET",
        url: `/images/${imageId}`
    });
    return response.image;
}
export async function updateImage(imageId, blueprint) {
    const response = await doRequest({
        method: "PUT",
        url: `/images/${imageId}`,
        data: cleanPayload(blueprint)
    });
    return response.image;
}
export async function deleteImage(imageId) {
    await doRequest({
        method: "DELETE",
        url: `/images/${imageId}`
    });
}
//# sourceMappingURL=images.js.map