export interface TagResourceRef {
    resource_id: string;
    resource_type: "droplet" | "image" | "volume" | "volume_snapshot" | "database" | string;
}
export interface TagResources {
    count?: number;
    last_tagged_uri?: string;
    droplets?: {
        count?: number;
        last_tagged_uri?: string;
    };
    images?: {
        count?: number;
        last_tagged_uri?: string;
    };
    volumes?: {
        count?: number;
        last_tagged_uri?: string;
    };
}
export interface Tag {
    name: string;
    resources?: TagResources;
}
export declare function listAllTags(): Promise<Tag[]>;
export declare function listTag(tag: string): Promise<Tag>;
export declare function createTag(tag: string): Promise<Tag>;
export declare function tagResource(tag: string, resources: TagResourceRef[]): Promise<void>;
export declare function untagResource(tag: string, resources: TagResourceRef[]): Promise<void>;
export declare function deleteTag(tag: string): Promise<void>;
