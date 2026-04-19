export declare class Seltzer {
    static init(): Seltzer;
    route({ method, path, handler }: {
        method: string;
        path: string;
        handler: any;
    }): this;
    handler(config: {
        adapter: string;
        options: object;
    }): this;
    listen(port: number): void;
}
