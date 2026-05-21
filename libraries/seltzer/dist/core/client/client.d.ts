import { Endpoint } from "../seltzer.js";
export declare const client: {
    get: (endpoint: Endpoint) => Promise<any>;
    post: (endpoint: Endpoint, data: any) => Promise<any>;
    put: (endpoint: Endpoint, data: any) => Promise<any>;
    patch: (endpoint: Endpoint, data: any) => Promise<any>;
    delete: (endpoint: Endpoint) => Promise<any>;
};
