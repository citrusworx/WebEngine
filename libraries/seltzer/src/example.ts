import { Seltzer } from "./core/seltzer.js";

const app = Seltzer.init();

app.route({
    method: "GET",
    path: "/",
    handler: () => ({
        body: [{ message: "Hello World!" }],
    }),
});

app.listen(3000);
