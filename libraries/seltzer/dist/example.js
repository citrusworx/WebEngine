import { Seltzer } from "./core/seltzer.js";
const app = Seltzer.init();
app.route({
    method: "GET",
    path: "/",
    handler: (ctx) => {
        return ctx.json([{ message: "Hello World!" }]);
    }
});
app.listen(3000);
//# sourceMappingURL=example.js.map