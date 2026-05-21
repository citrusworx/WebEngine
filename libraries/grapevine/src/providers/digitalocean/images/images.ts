import { parseYAML, client } from "../../../infrastructure/util/utilities.js";
import { cleanPayload } from "../utilities.js";

// Images on DO
interface Image {
    id: number;
    name: string;
    distribution?: string;
    blueprint: {
        name: string;
        image: {
            name: string;
            distribution?: string;
            description?: string;
            region?: string;
            tags?: string[];
        }
    }
}

export async function listAllImages(){
    const response = await client.get("/v2/images")
    return response.data.images
}

export async function createCustomImage(schematic: string){
    const blueprint: Image = parseYAML(schematic);
    const payload = cleanPayload(blueprint.blueprint.image);
    const response = await client.post("/v2/images", payload)
    return response.data.image
}

export async function listExistingImage(imageId: string){
    const response = await client.get(`/v2/images/${imageId}`)
    return response.data.image
}

export async function updateImage(imageId: string, blueprint: any){
    const response = await client.put(`/v2/images/${imageId}`, blueprint)
    return response.data.image
}

export async function deleteImage(imageId: string){
    await client.delete(`/v2/images/${imageId}`)
} 