import { doRequest } from "../client.js";
export async function listAllTags() {
    const response = await doRequest({
        method: "GET",
        url: "/tags"
    });
    return response.tags;
}
export async function listTag(tag) {
    const response = await doRequest({
        method: "GET",
        url: `/tags/${encodeURIComponent(tag)}`
    });
    return response.tag;
}
export async function createTag(tag) {
    const response = await doRequest({
        method: "POST",
        url: "/tags",
        data: { name: tag }
    });
    return response.tag;
}
export async function tagResource(tag, resources) {
    await doRequest({
        method: "POST",
        url: `/tags/${encodeURIComponent(tag)}/resources`,
        data: { resources }
    });
}
export async function untagResource(tag, resources) {
    await doRequest({
        method: "DELETE",
        url: `/tags/${encodeURIComponent(tag)}/resources`,
        data: { resources }
    });
}
export async function deleteTag(tag) {
    await doRequest({
        method: "DELETE",
        url: `/tags/${encodeURIComponent(tag)}`
    });
}
//# sourceMappingURL=tags.js.map