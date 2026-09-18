import { WPRead } from "../core/WPRead.js";
import type { WPCoreConfig } from "../core/WPCore.js";
import type { WordPressPayload } from "../types/api.js";
export declare class Users extends WPRead {
    private readonly creator;
    private readonly updater;
    constructor(config?: Partial<WPCoreConfig>);
    getAll(): any;
    getById(id: string | number): any;
    getByEmail(email: string): any;
    getByCity(city: string): any;
    getByCityState(state: string, city: string): any;
    create(data: WordPressPayload): Promise<any>;
    update(id: string | number, data: WordPressPayload): Promise<any>;
    delete(id: string | number): Promise<any>;
}
