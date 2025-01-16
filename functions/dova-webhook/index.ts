import "jsr:@std/dotenv/load";

const N8N_DOVA_WEBHOOK = Deno.env.get("N8N_DOVA_WEBHOOK");
const N8N_DOVA_WEBHOOK_USER = Deno.env.get("N8N_DOVA_WEBHOOK_USER");
const N8N_DOVA_WEBHOOK_PASSWORD = Deno.env.get("N8N_DOVA_WEBHOOK_PASSWORD");

export async function dovaWebhook({
  userId,
  content,
  messageId,
}: {
  userId: string;
  content: string;
  agentId?: string;
  messageId?: string;
}) {
  if (!N8N_DOVA_WEBHOOK || !N8N_DOVA_WEBHOOK_USER || !N8N_DOVA_WEBHOOK_PASSWORD)
    throw "Missing n8n env variables";

  const encodedCredentials = btoa(
    `${N8N_DOVA_WEBHOOK_USER}:${N8N_DOVA_WEBHOOK_PASSWORD}`
  );
  await fetch(N8N_DOVA_WEBHOOK, {
    method: "POST",
    headers: {
      Authorization: `Basic ${encodedCredentials}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messageId,
      action: "sendMessage",
      sessionId: userId,
      chatInput: content,
    }),
  });
}
