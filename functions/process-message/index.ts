import { Request } from "https://deno.land/x/oak@v17.1.4/mod.ts";
import { createMessage } from "../../db.ts";
import { dovaWebhook } from "../dova-webhook/index.ts";
import { requireRedis } from "../../redis.ts";

export const processMessage = async (req: Request) => {
  const token = req.headers.get("x-ghost-token");
  if (!token) throw "invalid request";

  const data = await req.body.json();

  const {
    data: responseData,
    error: responseError,
    status,
    statusText,
  } = await createMessage({
    userId: data.userId,
    content: data.content,
    sender: data.sender,
  });

  if (responseError || !responseData.length)
    return {
      status: 400,
    };
  /**
   *
   * 📱 call dova hotline
   */
  if (data.sender === "user") {
    await dovaWebhook({
      userId: data.userId,
      content: data.content,
    });
  }

  /**
   *
   * 💊 call morpheus
   */
  const [message] = responseData;
  if (data.sender === "agent") {
    const client = await requireRedis();
    await client.publish(
      "chat_response",
      JSON.stringify({
        userId: data.userId,
        messageId: message.id,
      })
    );
  }

  return {
    status,
    statusText,
  };
};
