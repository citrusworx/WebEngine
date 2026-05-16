import axios from "axios";
import { parseYAML } from "../../../infrastructure/util/utilities.js";
import { cleanPayload } from "../utilities.js";
export async function deployByBlueprint(blueprint) {
    const manifest = parseYAML(blueprint);
    const droplet = cleanPayload(manifest.blueprint.droplet);
    console.log(JSON.stringify(droplet, null, 2));
    try {
        const response = await axios.post("https://api.digitalocean.com/v2/droplets", droplet, {
            headers: {
                Authorization: `Bearer ${process.env.DO_TOKEN}`,
                "Content-Type": "application/json"
            }
        });
        console.log(response);
        return response.data.droplet;
    }
    catch (error) {
        if (axios.isAxiosError(error)) {
            console.log(error.response?.data);
        }
        throw error;
    }
}
// Returns the status of a particular droplet by ID
export async function getDropletStatus(id) {
    const response = await axios.get(`https://api.digitalocean.com/v2/droplets/${id}`, {
        headers: {
            Authorization: `Bearer ${process.env.DO_TOKEN}`
        }
    });
    return response.data.droplet.status;
}
// List all droplets
export async function listAllDroplets() {
    const response = await axios.get(`https://api.digitalocean.com/v2/droplets`, {
        headers: {
            Authorization: `Bearer ${process.env.DO_TOKEN}`
        }
    });
    return response.data.droplets;
}
// Get single droplet
export async function getDroplet(id) {
    const response = await axios.get(`https://api.digitalocean.com/v2/droplets/${id}`, {
        headers: {
            Authorization: `Bearer ${process.env.DO_TOKEN}`
        }
    });
    return response.data.droplet;
}
// Create New Droplet
export async function createDroplet(droplet) {
    const response = await axios.post("https://api.digitalocean.com/v2/droplets", droplet.droplet, {
        headers: {
            Authorization: `Bearer ${process.env.DO_TOKEN}`,
            "Content-Type": "application/json"
        }
    });
    return response.data.droplet;
}
export async function createDroplets(droplets) {
    const promises = droplets.map(createDroplet);
    return Promise.all(promises);
}
// Deleting Droplets
// 
// 
// 
export async function deleteDropletsByTag(tag) {
    // Delete all droplets with a specific tag
    const response = await axios.delete(`https://api.digitalocean.com/v2/droplets?tag_name=${tag}`, {
        headers: {
            Authorization: `Bearer ${process.env.DO_TOKEN}`
        }
    });
    return response.data;
}
export async function NukeDroplet(id) {
    // Delete a droplet and all associated resources (volumes, snapshots, etc.)
    const response = await axios.delete(`https://api.digitalocean.com/v2/droplets/${id}/destroy_with_associated_resources/dangerous`, {
        headers: {
            Authorization: `Bearer ${process.env.DO_TOKEN}`,
            "X-Dangerous": "true"
        }
    });
    return response.data;
}
export async function NukeDropletLite(id, resources) {
    // Selectively delete a droplet and its associated resources
    const response = await axios.delete(`https://api.digitalocean.com/v2/droplets/${id}/destroy_with_associated_resources/selective`, {
        headers: {
            Authorization: `Bearer ${process.env.DO_TOKEN}`
        },
        data: resources
    });
    return response.data;
}
export async function deleteDroplet(id) {
    const response = await axios.delete(`https://api.digitalocean.com/v2/droplets/${id}`, {
        headers: {
            Authorization: `Bearer ${process.env.DO_TOKEN}`
        }
    });
    return response.data;
}
// Backups for Droplets
// 
// 
// 
export async function listBackups(id) {
    const response = await axios.get(`https://api.digitalocean.com/v2/droplets/${id}/backups`, {
        headers: {
            Authorization: `Bearer ${process.env.DO_TOKEN}`
        }
    });
    return response.data.backups;
}
export async function listBackupPolicy(id) {
    const response = await axios.get(`https://api.digitalocean.com/v2/droplets/${id}/backups/policy`, {
        headers: {
            Authorization: `Bearer ${process.env.DO_TOKEN}`
        }
    });
    return response.data.backup_policy;
}
// Firewalls for Droplets
// 
// 
// 
export async function listFirewalls(id) {
    const response = await axios.get(`https://api.digitalocean.com/v2/droplets/${id}/firewalls`, {
        headers: {
            Authorization: `Bearer ${process.env.DO_TOKEN}`
        }
    });
    return response.data.firewalls;
}
// Snapshots for Droplets
// 
// 
// 
export async function listSnapshots(id) {
    const response = await axios.get(`https://api.digitalocean.com/v2/droplets/${id}/snapshots`, {
        headers: {
            Authorization: `Bearer ${process.env.DO_TOKEN}`
        }
    });
    return response.data.snapshots;
}
//# sourceMappingURL=droplet.js.map