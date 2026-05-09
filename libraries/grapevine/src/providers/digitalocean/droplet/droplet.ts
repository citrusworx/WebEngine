import axios from "axios";
import { parseYAML } from "../../../infrastructure/util/utilities.js";
import { cleanPayload } from "../utilities.js";

export interface DropletBlueprint {
    blueprint: {
        name: string;    
        droplet: {
            name: string;
            region: string;
            size: string;
            image: string;
            ssh_keys?: string[];
            backups: boolean;
            backup_policy?: {
                name: string;
            }
            ipv6?: boolean;
            monitoring?: boolean;
            tags?: string[];
            user_data?: string;
            volumes?: string[];
            vpc_uuid?: string;
            with_droplet_agent?: boolean;
        }
    }
}

export interface Droplet {
        name: string;    
        droplet: {
            name: string;
            region: string;
            size: string;
            image: string;
            ssh_keys?: string[];
            backups: boolean;
            backup_policy?: {
                name: string;
            }
            ipv6?: boolean;
            monitoring?: boolean;
            tags?: string[];
            user_data?: string;
            volumes?: string[];
            vpc_uuid?: string;
            with_droplet_agent?: boolean;
        }
}

export interface DropletResource {
    id: number | undefined;
    name: string;
    memory: number;
    vcpus?: number;
    disk?: number;
    disk_info?: object[];
    locked?: boolean;
    status: string;
    kernel?: object | null;
    created_at?: string;
    features?: string[];
    backup_ids?: number[];
    next_backup_window?: object | null;
    snapshot_ids?: number[];
    image: Record<string, unknown>
    volume_ids?: string[];
    size: Record<string, unknown>;
    size_slug?: string;
    networks?: Record<string, unknown>;
    region?: Record<string, unknown>;
    tags?: string[];
}

export interface DropletCreateResponse {
    droplet: DropletResource;
    links: {
        actions: object[];
    }
}

export interface AllDroplets {
    per_page?: number;
    page?: number;
    tag_name?: string;
    name?: string;
    type?: string;
}


export async function deployByBlueprint(blueprint: string): Promise<DropletResource>{
    const manifest = parseYAML<DropletBlueprint>(blueprint)
    const droplet = cleanPayload(manifest.blueprint.droplet);
    console.log(JSON.stringify(droplet, null, 2));
    try {
    const response = await axios.post<DropletCreateResponse>(
        "https://api.digitalocean.com/v2/droplets",
        droplet,
        {
            headers: {
                Authorization: `Bearer ${process.env.DO_TOKEN}`,
                "Content-Type": "application/json"
            }
        }
    )
        console.log(response);
        return response.data.droplet
    }
    catch(error) {
        if(axios.isAxiosError(error)){
            console.log(error.response?.data);
            
        }
        throw error;
    }
}


// Returns the status of a particular droplet by ID
export async function getDropletStatus(id: number): Promise<string>{
    const response = await axios.get<{ droplet: DropletResource }>(
        `https://api.digitalocean.com/v2/droplets/${id}`,
        {
            headers: {
                Authorization: `Bearer ${process.env.DO_TOKEN}`
            }
        }
    )

    return response.data.droplet.status
}

// List all droplets
export async function listAllDroplets(): Promise<DropletResource[]>{
    const response = await axios.get<{droplets: DropletResource[]}>(
        `https://api.digitalocean.com/v2/droplets`,
        {
            headers: {
                Authorization: `Bearer ${process.env.DO_TOKEN}`
            }
        }
    )

    return response.data.droplets
}

// Get single droplet
export async function getDroplet(id: number): Promise<DropletResource>{
    const response = await axios.get<{droplet: DropletResource}>(
        `https://api.digitalocean.com/v2/droplets/${id}`,
        {
            headers: {
                Authorization: `Bearer ${process.env.DO_TOKEN}`
            }
        }
    )

    return response.data.droplet
}

// Create New Droplet
export async function createDroplet(droplet: Droplet): Promise<DropletResource>{
    const response = await axios.post<DropletCreateResponse>(
        "https://api.digitalocean.com/v2/droplets",
        droplet.droplet,
        {
            headers: {
                Authorization: `Bearer ${process.env.DO_TOKEN}`,
                "Content-Type": "application/json"
            }
        }
    )
    return response.data.droplet
}

export async function createDroplets(droplets: Droplet[]): Promise<DropletResource[]>{
    const promises = droplets.map(createDroplet);
    return Promise.all(promises);
}

// Deleting Droplets
// 
// 
// 

export async function deleteDropletsByTag(tag: string): Promise<{message: string}>{
    // Delete all droplets with a specific tag
    const response = await axios.delete(
        `https://api.digitalocean.com/v2/droplets?tag_name=${tag}`,
        {
            headers: {
                Authorization: `Bearer ${process.env.DO_TOKEN}`
            }
        }
    )
    return response.data
}

export async function NukeDroplet(id: number): Promise<{message: string}>{
    // Delete a droplet and all associated resources (volumes, snapshots, etc.)
    const response = await axios.delete(
        `https://api.digitalocean.com/v2/droplets/${id}/destroy_with_associated_resources/dangerous`,
        {
            headers: {
                Authorization: `Bearer ${process.env.DO_TOKEN}`,
                "X-Dangerous": "true"
            }
        }
    )
    return response.data
}

export async function NukeDropletLite(
        id: number, resources: 
        {
            reserved_ips?: string[],
            volumes?: string[],
            snapshots?: string[],
            volume_snapshots?: string[]
        }): Promise<{message: string}>
        {
    // Selectively delete a droplet and its associated resources
        const response = await axios.delete(
            `https://api.digitalocean.com/v2/droplets/${id}/destroy_with_associated_resources/selective`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.DO_TOKEN}`
            },
            data: resources
        }
    )
    return response.data
}

export async function deleteDroplet(id: number): Promise<{message: string}>{
    const response = await axios.delete(
        `https://api.digitalocean.com/v2/droplets/${id}`,
        {
            headers: {
                Authorization: `Bearer ${process.env.DO_TOKEN}`
            }
        }
    )
    return response.data
}

// Backups for Droplets
// 
// 
// 

export async function listBackups(id: number): Promise<object[]>{
    const response = await axios.get<{backups: object[]}>(
        `https://api.digitalocean.com/v2/droplets/${id}/backups`,
        {
            headers: {
                Authorization: `Bearer ${process.env.DO_TOKEN}`
            }
        }
    )
    return response.data.backups
}

export async function listBackupPolicy(id: number): Promise<object>{
    const response = await axios.get<{backup_policy: object}>(
        `https://api.digitalocean.com/v2/droplets/${id}/backups/policy`,
        {
            headers: {
                Authorization: `Bearer ${process.env.DO_TOKEN}`
            }
        }
    )
    return response.data.backup_policy
}

// Firewalls for Droplets
// 
// 
// 

export async function listFirewalls(id: number): Promise<object[]>{
    const response = await axios.get<{firewalls: object[]}>(
        `https://api.digitalocean.com/v2/droplets/${id}/firewalls`,
        {
            headers: {
                Authorization: `Bearer ${process.env.DO_TOKEN}`
            }
        }
    )
    return response.data.firewalls
}

// Snapshots for Droplets
// 
// 
// 

export async function listSnapshots(id: number): Promise<object[]>{
    const response = await axios.get<{snapshots: object[]}>(
        `https://api.digitalocean.com/v2/droplets/${id}/snapshots`,
        {
            headers: {
                Authorization: `Bearer ${process.env.DO_TOKEN}`
            }
        }
    )
    return response.data.snapshots
}