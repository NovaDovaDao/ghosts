import { Context } from "https://deno.land/x/oak@v17.1.4/mod.ts";
import { checkAnonReqCount } from "./redis.service.ts";
import { Status } from "jsr:@oak/commons@1/status";

const kv = await Deno.openKv();

interface N8nDovaMessage {
  output: string | { reason: string; configuration?: object };
}

interface Message {
  role: "user" | "agent" | "system";
  content: string;
  configuration?: object;
  timestamp: number;
}

export const getChatHistory = async (ctx: Context) => {
  const userId = ctx.state.userId || ctx.request.ip;

  const entries = kv.list<Message>({ prefix: ["chat", userId] });
  const results: Message[] = [];
  for await (const entry of entries) {
    results.push(entry.value);
  }

  ctx.response.body = results.sort((a, b) => a.timestamp - b.timestamp);
};

export const addNewMessage = async (ctx: Context) => {
  try {
    let userId = ctx.state.userId;

    if (!userId) {
      userId = ctx.request.ip;
      await checkAnonReqCount(ctx.request.ip);
    }

    const addMessage = saveMessage(userId);

    const body = await ctx.request.body.json();
    await addMessage({ role: "user", content: body.content });

    const agentResponse = await fetch(Deno.env.get("N8N_DOVA_WEBHOOK")!, {
      method: "POST",
      body: JSON.stringify({
        sessionId: userId,
        content: body.content,
      }),
      headers: {
        "x-ghost-token": ctx.request.headers.get("x-ghost-token"),
      },
    });

    if (!agentResponse.ok) throw new Error("n8n response not ok");

    const agentMessage: N8nDovaMessage = await agentResponse.json();

    ctx.response.status = Status.Created;

    if (
      typeof agentMessage.output === "object" &&
      "reason" in agentMessage.output
    ) {
      ctx.response.body = await addMessage({
        role: "agent",
        content: agentMessage.output.reason,
        configuration: agentMessage.output.configuration,
      });
    } else {
      ctx.response.body = await addMessage({
        role: "agent",
        content: agentMessage.output,
      });
    }
  } catch (error) {
    console.error("Unable to save new message", error);

    let content = "Unable to respond";
    if (error instanceof Error) content += `. ${error.message}`;

    ctx.response.status = Status.Created;
    ctx.response.body = {
      role: "system",
      content,
      timestamp: Date.now(),
    };
  }
};

const saveMessage =
  (userId: string) =>
  async ({
    role,
    content,
    configuration,
  }: Pick<Message, "content" | "role" | "configuration">) => {
    const messageId = crypto.randomUUID();
    const message = {
      role,
      content,
      configuration,
      timestamp: Date.now(),
    } satisfies Message;
    await kv.set(["chat", userId, messageId], message);
    return message;
  };
