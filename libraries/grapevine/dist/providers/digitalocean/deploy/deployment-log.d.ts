export interface DropletActions {
    droplet_id: number;
    per_page: number;
    page: number;
}
export interface DropletAction {
    id: number;
    status: string;
    type: string;
    started_at: string;
    completed_at: string;
    resource_id: number;
    region: Record<string, unknown>;
    region_slug: string;
}
export declare function getDropletActions(droplet_id: number): Promise<DropletActions>;
export declare function getAction(droplet_id: number, action_id: number): Promise<DropletAction>;
export declare function logDropletActions(droplet_id: number): Promise<void>;
