import { Seltzer } from "./core/seltzer.ts";

const app = Seltzer.init();

app.route({
    method: "GET",
    path: "/",
    handler: (ctx: any) => {
        return ctx.json([{message: "Hello World!"}]);
    }
});

app.listen(3000);
