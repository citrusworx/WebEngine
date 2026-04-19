import express from "express";
import dotenv from "dotenv";
import path from "path";
import { deployByBlueprint, getDropletStatus } from "@citrusworx/grapevine";
import { createAlertPolicy } from "@citrusworx/grapevine";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.get("/droplet/status/:id", async (req, res) => {
    try {
        const id = req.params
        const results = await getDropletStatus(Number(id))
        res.status(200).json({
            success: true,
            data: results.toString()
        })
    }
    catch(error){
        if(error instanceof Error){
            res.status(500).json({
            data: error
            })
        }
    }
    console.log(await getDropletStatus(561332198))
});

app.post("/blueprint", async (req, res) => {

    try{
        const blueprint = path.resolve(__dirname, "./blueprints/create-droplet.yaml");
        const result = await deployByBlueprint(blueprint);
        res.status(200).json({
            success: true,
            data: result
        })
    }
    catch(error){
        if (error instanceof Error){
            res.status(500).json({
            success: false,
            error: error.message
        })
        }
    }
    
})

app.post("/policy/:id", async (req, res ) => {
    const id = req.params;
    const result = createAlertPolicy.memoryUsage("memory_usage");
})

app.listen(Number(process.env.PORT), "localhost", () => {
    console.log(`Server running on port ${process.env.PORT}!`)
    
});
