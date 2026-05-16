import { WPRead } from "../core/WPRead";
import type { WordPressPayload } from "../types/api";
export declare class Users extends WPRead {
    getAll(): any;
    getById(id: string | number): any;
    getByEmail(email: string): any;
    getByCity(city: string): any;
    getByCityState(state: string, city: string): any;
    create(data: WordPressPayload): Promise<any>;
    update(id: string | number, data: WordPressPayload): Promise<any>;
    delete(id: string | number): Promise<any>;
}
