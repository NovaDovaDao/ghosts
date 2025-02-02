import { Request } from "https://deno.land/x/oak@v17.1.4/mod.ts";
import { getUserIdFromRequest } from "./auth.service.ts";
import { checkAnonReqCount } from "./redis.service.ts";

const kv = await Deno.openKv();

export const getChatHistory = async (req: Request) => {
  let userId = await getUserIdFromRequest(req);

  if (!userId) {
    userId = req.ip;
  }

  const entries = kv.list({ prefix: ["chat", userId] });
  const results = [];
  for await (const entry of entries) {
    results.push(entry.value);
  }
  return results;
};

interface Message {
  role: "user" | "agent" | "system";
  content: string;
  timestamp: number;
}
export const addNewMessage = async (req: Request): Promise<Message> => {
  try {
    let userId = await getUserIdFromRequest(req);

    if (!userId) {
      userId = req.ip;
      await checkAnonReqCount(req.ip);
    }

    const addMessage = saveMessage(userId);

    const body = await req.body.json();
    await addMessage({ role: "user", content: body.content });

    const agentResponse = await fetch(Deno.env.get("N8N_DOVA_WEBHOOK")!, {
      method: "POST",
      body: JSON.stringify({
        sessionId: userId,
        content: body.content,
      }),
      headers: {
        "x-ghost-token": req.headers.get("x-ghost-token"),
      },
    });

    if (!agentResponse.ok) throw new Error("n8n response not ok");

    const agentMessage: { output: string } = await agentResponse.json();

    return addMessage({ role: "agent", content: agentMessage.output });
  } catch (error) {
    console.error("Unable to save new message", error);

    let content = "Unable to respond";
    if (error instanceof Error) content += `. ${error.message}`;

    return {
      role: "system",
      content,
      timestamp: Date.now(),
    };
  }
};

const saveMessage =
  (userId: string) =>
  async ({ role, content }: Pick<Message, "content" | "role">) => {
    const messageId = crypto.randomUUID();
    const message = {
      role,
      content,
      timestamp: Date.now(),
    } satisfies Message;
    await kv.set(["chat", userId, messageId], message);
    return message;
  };
