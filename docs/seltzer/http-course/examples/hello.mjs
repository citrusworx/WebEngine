import { Seltzer } from "@citrusworx/seltzer";

const app = Seltzer.init();
app.route({
  method: "GET",
  path: "/hello",
  handler: () => ({ body: { message: "Hello, HTTP!" } }),
});
app.listen(3000);
