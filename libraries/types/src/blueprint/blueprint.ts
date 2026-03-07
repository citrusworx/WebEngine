//  Blueprints
// 
// Params:
// @param name - Name of the Blueprint
// @param modules - WebEngines modules in project
// @param adapters - 3rd Party adapters in use

export interface Blueprint {
    name: string;
    version: string;
    description: string;

    modules: string[];
    
    adapters: {
        commerce?: string;
        cms?: string;
        payments?: string;
        storage?: string;
    };

    services: string[];
}