import { Request } from "https://deno.land/x/oak@v17.1.4/mod.ts";
import { getUserIdFromRequest } from "./auth.service.ts";

const kv = await Deno.openKv();

export const getChatHistory = async (req: Request) => {
  const { userId } = await getUserIdFromRequest(req);

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
export const addNewMessage = async (req: Request) => {
  const { userId } = await getUserIdFromRequest(req);
  const addMessage = saveMessage(userId);

  const body = await req.body.json();
  await addMessage({ role: "user", content: body.content });

  const agentResponse = await fetch(Deno.env.get("N8N_DOVA_WEBHOOK")!, {
    method: "POST",
    body: JSON.stringify({
      sessionId: userId,
      content: body.content,
    }),
  });
  const agentMessage: { output: string } = await agentResponse.json();

  return addMessage({ role: "agent", content: agentMessage.output });
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
