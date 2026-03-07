import { Blueprint} from "@citrusworx/types";
import { Environment } from "@citrusworx/types/environment/environment.js";
import {DeploymentManifest} from "@citrusworx/types/deployment/deployment-manifest.js"

export class WebEngine {
        private currentBlueprint?: Blueprint;
        private manifest: DeploymentManifest | null = null;


    constructor(){
        console.log("WebEngine initialized");
    }

    start(){
        console.log("WebEngine runtime started");
    }

    loadBlueprint(blueprint: Blueprint, custom?: string){
        // 1. Check blueprint name
        // 2. Verify Blueprint exists
        // 3. Parse Blueprint Config
        // 4. Create Deploy Manifest based on Blueprint config
        // 5. Insert Deploy Manifest (via GrapeVine)
        // 6. Deploy Blueprint into Application
        // ? How do we integrate blueprint without crashing or reducing usability?
        
        this.validateBlueprint(blueprint)
        this.currentBlueprint = blueprint;

        console.log(`Blueprint loaded: ${blueprint.name}`);
    }

    resolveModules(){
        if(!this.currentBlueprint){
            throw new Error("No blueprint loaded");
        }

        console.log("Resolving modules...")

        for(const module of this.currentBlueprint.modules){
            console.log(`Loading module: ${module}`)
        }
    }

    deploy(env: Environment){
        if(!this.currentBlueprint){
            throw new Error("Cannot deploy without a blueprint");
        }
        console.log(`Deploying ${this.currentBlueprint.name} to ${env}`)
    }

    private validateBlueprint(blueprint: Blueprint){
        if(!blueprint.modules || blueprint.modules.length === 0){
            throw new Error("Blueprint must include modules");
        }
    }

    private buildManifest(id: string, createdAt: Date, projectId: string, env: Environment, blueprintName: Blueprint){
        // 1. Parse manifest
        // ? What other steps are required to build the Deployment Manifest?
        const manifest: DeploymentManifest = {
            id,
            createdAt,
            projectId,
            blueprint: blueprintName,
            environment: env,

            services: ["service"],

            modules: this.currentBlueprint!.modules,

            adapters: this.currentBlueprint?.adapters,

            infrastructure: {
                server: true,
                database: true
            }
        }

        this.manifest = manifest;

        return manifest;
    }
}