export interface ImageBlueprint {
    name: string;
    url?: string;
    region?: string;
    distribution?: string;
    description?: string;
    tags?: string[];
}
export interface ImageBlueprintDocument {
    name?: string;
    distribution?: string;
    blueprint: {
        name: string;
        image: ImageBlueprint;
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
export declare function listAllImages(query?: {
    type?: string;
    private?: boolean;
    tag_name?: string;
    per_page?: number;
    page?: number;
}): Promise<ImageResource[]>;
export declare function createCustomImage(schematic: string | ImageBlueprint): Promise<ImageResource>;
export declare function listExistingImage(imageId: string | number): Promise<ImageResource>;
export declare function updateImage(imageId: string | number, blueprint: Partial<ImageBlueprint>): Promise<ImageResource>;
export declare function deleteImage(imageId: string | number): Promise<void>;
