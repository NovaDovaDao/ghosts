import { Application, Router } from "https://deno.land/x/oak@v17.1.4/mod.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import { getChat } from "./functions/get-chat/index.ts";
import { processMessage } from "./functions/process-message/index.ts";

const router = new Router();
router.get("/get-chat", async (context) => {
  context.response.body = await getChat(context.request);
});

router.post("/process-message", async (context) => {
  const response = await processMessage(context.request);
  context.response.status = response.status;
});

const app = new Application();
app.use(oakCors());
app.use(router.routes());
app.use(router.allowedMethods());

const port = parseInt(Deno.env.get("PORT") ?? "5001");
await app.listen({ port });
