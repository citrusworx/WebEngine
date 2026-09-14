# Creating A Droplet

Prefer the exported `createDroplet` / `deployByBlueprint` / `grape apply` APIs documented in [grapevine-digitalocean.md](../../grapevine-digitalocean.md) and the [Tutorial](../../grapevine-tutorial.md). The snippet below is a historical illustration of the DigitalOcean POST; current code goes through `doRequest` in `libraries/grapevine/src/providers/digitalocean/droplet/droplet.ts`. There is no `DigitalOcean.Droplet.create` class API.

We have many options when it comes to creating a droplet with DigitalOcean.

```js
export async function deployByBlueprint(blueprint: string): Promise<DropletResource>{
    const manifest= parseYAML<DropletBlueprint>(blueprint)
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
```
