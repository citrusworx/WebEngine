# Creating A Droplet

We have many options when it comes to creating a droplet with Digital Ocean.

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
