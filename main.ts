import { Application, Router } from "https://deno.land/x/oak@v17.1.4/mod.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import { getChatHistory, addNewMessage } from "./services/chat.service.ts";
import { createAgent, getAgent } from "./services/agent.service..ts";

async function main() {
  const router = new Router();
  router
    .get("/chat", async (ctx) => {
      ctx.response.body = await getChatHistory(ctx.request);
    })
    .post("/chat", async (ctx) => {
      ctx.response.body = await addNewMessage(ctx.request);
    });

  router
    .get("/agent", async (ctx) => {
      ctx.response.body = await getAgent(ctx.request);
    })
    .post("/agent", async (ctx) => {
      ctx.response.body = await createAgent(ctx.request);
    });

  const app = new Application();
  app.use(oakCors());
  app.use(router.routes());
  app.use(router.allowedMethods());

  const port = parseInt(Deno.env.get("PORT") ?? "5001");
  console.log(`👻 boo! http://localhost:${port}`);
  await app.listen({ port });
}

if (import.meta.main) {
  main();
}
