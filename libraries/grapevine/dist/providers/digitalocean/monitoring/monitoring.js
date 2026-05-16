import axios from "axios";
export const postAlertPolicy = async (policy) => {
    // Create One Axios Call for usage in createAlertPolicy
    const client = await axios.post(`https:api.digitalocean.com/v1/insights/droplet`, policy, {
        headers: {
            Authorization: `Bearer ${process.env.DO_TOKEN}`,
            "Content-Type": "application/json"
        }
    });
    console.log(client);
    return client.data;
};
export const createAlertPolicy = {
    memoryUsage: (name) => {
        postAlertPolicy(name);
    },
    diskRead: (id) => {
    },
    diskUtilization: (id) => {
    },
    percentCPU: (id) => { }
};
//# sourceMappingURL=monitoring.js.map