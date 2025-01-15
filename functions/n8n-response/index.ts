import { Request } from "https://deno.land/x/oak@v17.1.4/mod.ts";
import { updateMessages } from "../../db.ts";
import { requireRedis } from "../../redis.ts";
import * as uuid from "jsr:@std/uuid";

export const processN8nResponse = async (req: Request) => {
  const token = req.headers.get("x-ghost-token");
  if (!token) throw "invalid request";

  const body = await req.body.json();

  const messageId = uuid.v1.generate();
  const parsedMessage = JSON.parse(body.message);
  const saveMessageResponse = await updateMessages({
    messageId,
    sender: "agent",
    userId: parsedMessage.userId,
    content: parsedMessage.content,
  });

  const client = await requireRedis();
  if (saveMessageResponse?.ok)
    await client.publish(
      "chat_response_pubsub",
      JSON.stringify({
        messageId,
        userId: parsedMessage.userId,
      })
    );
};
