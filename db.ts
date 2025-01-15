import "jsr:@std/dotenv/load";
import { Message, Sender } from "./types.ts";

const kv = await Deno.openKv(Deno.env.get("KV_PATH"));

export const updateMessages = async (payload: {
  userId: string;
  agentId?: string;
  messageId: string;
  content: string;
  sender: Sender;
}) => {
  const key = [
    payload.userId,
    "chat",
    payload.agentId ?? "general",
    payload.messageId,
  ];
  const value = {
    sender: payload.sender,
    content: payload.content,
    timestamp: Date.now(),
    messageId: payload.messageId,
  } satisfies Message;

  const res = await kv
    .atomic()
    .check({ key, versionstamp: null }) // Correctly uses existingValue
    .set(key, value)
    .commit();

  if (res.ok) {
    return { ok: true, messageId: payload.messageId };
  }
};
