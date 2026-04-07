export class Seltzer {
    static init() {
        return new Seltzer();
    }

    route({method, path, handler}: {method: string, path: string, handler: any}){
        return this;
    }

    handler(ctx: any){
        return this;
    }

    listen(port: number){

    }
}