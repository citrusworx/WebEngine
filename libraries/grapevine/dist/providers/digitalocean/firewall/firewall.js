import { client } from "../../../infrastructure/util/utilities.js";
export async function createFireWall(blueprint) {
    await client.post("/firewalls", blueprint);
}
export async function listFirewall(firewall) { }
export async function listAllFirewalls() { }
export async function updateFirewall(firewall) { }
export async function deleteFirewall() { }
export async function removeDropletsFromFirewall() { }
export async function removeRulesFromFirewall() { }
export async function removeTagsFromFirewall() { }
export async function addDropletsToFirewall() { }
export async function addRulesToFirewall() { }
export async function addTagsToFirewall() { }
//# sourceMappingURL=firewall.js.map