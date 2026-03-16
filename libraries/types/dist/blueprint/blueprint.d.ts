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
