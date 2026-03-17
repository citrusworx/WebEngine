import axios from "axios";
import { loadYAML } from "../../../infrastructure/util/utilities.js";

export interface DropletBlueprint {
    blueprint: {
        name: string;    
        droplet: {
            name: string;
            region: string;
            size: string;
            image: string;
            ssh_keys: string[];
            backups: boolean;
            backup_policy: {
                name: string;
            }
            ipv6: boolean;
            monitoring: boolean;
            tags: string[];
            user_data: string;
            volumes: string[];
            vpc_uuid: string;
            with_droplet_agent: boolean;
        }
    }
}

export interface DropletResource {
    id: number;
    name: string;
    memory: number;
    vcpus: number;
    disk: number;
    disk_info: object[];
    locked: boolean;
    status: string;
    kernel: object | null;
    created_at: string;
    features: string[];
    backup_ids: number[];
    next_backup_window: object | null;
    snapshot_ids: number[];
    image: Record<string, unknown>
    volume_ids: string[];
    size: Record<string, unknown>;
    size_slug: string;
    networks: Record<string, unknown>;
    region: Record<string, unknown>;
    tags: string[];
}

export interface DropletCreateResponse {
    droplet: DropletResource;
    links: {
        actions: object[];
    }
}


export async function deployByBlueprint(blueprint: string): Promise<DropletResource>{
    const manifest= loadYAML<DropletBlueprint>(blueprint)
    const droplet = manifest.blueprint.droplet
    
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
    return response.data.droplet
}

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