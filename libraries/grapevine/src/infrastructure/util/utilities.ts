import fs from "node:fs";
import axios from "axios";
import * as jsyaml from "js-yaml";
import { DropletCreateResponse } from "@citrusworx/grapevine/providers/digitalocean/DigitalOcean.js";
// Create a script that has utilities for parsing
// the blueprints and creating various IaC formats

export function loadYAML<T>(file: string): T {
    const deployManifest = fs.readFileSync(file, "utf8");
    return jsyaml.load(deployManifest) as T;
}

export const client = axios.create({
    baseURL: `https://api.digitalocean.com/v2`,
    headers: {
        Authorization: `Bearer ${process.env.DO_TOKEN}`,
        "Content-Type": "application/json"
    }
});


// const response = await client.post<DropletCreateResponse>{
//     "/droplets",
//     droplet
// };
