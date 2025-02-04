import { Application, Router } from "https://deno.land/x/oak@v17.1.4/mod.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import { getChatHistory, addNewMessage } from "./services/chat.service.ts";
import {
  createAgent,
  deployAgent,
  getAgent,
  getAgentById,
} from "./services/agent.service.ts";
import { getUserIdFromRequest } from "./services/auth.service.ts";

async function main() {
  const router = new Router();
  router.get("/chat", getChatHistory).post("/chat", addNewMessage);

  router
    .get("/agent", getAgent)
    .post("/agent", createAgent)
    .post("/agent/deploy", deployAgent)
    .get("/agent/:agentId", getAgentById);

  const app = new Application();
  app.use(async (ctx, next) => {
    const userId = await getUserIdFromRequest(ctx.request);
    ctx.state.userId = userId;
    await next();
  });
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
