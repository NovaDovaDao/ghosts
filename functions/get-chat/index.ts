import "jsr:@std/dotenv/load";
import { PrivyClient } from "@privy-io/server-auth";
import { Request } from "https://deno.land/x/oak@v17.1.4/mod.ts";

const kv = await Deno.openKv(Deno.env.get("KV_PATH"));

// Validate environment variables
const PRIVY_APP_ID = Deno.env.get("PRIVY_APP_ID");
const PRIVY_APP_SECRET = Deno.env.get("PRIVY_APP_SECRET");
if (!PRIVY_APP_ID || !PRIVY_APP_SECRET) {
  console.error(
    "Missing required environment variables: PRIVY_APP_ID and PRIVY_APP_SECRET must be set"
  );
  Deno.exit(1);
}
const privy = new PrivyClient(PRIVY_APP_ID, PRIVY_APP_SECRET);

export const getChat = async (req: Request) => {
  const token = req.headers.get("x-ghost-token");
  if (!token) throw "invalid request";

  const url = new URL(req.url);
  const { userId } = await privy.verifyAuthToken(token);
  const agentId = url.searchParams.get("agentId");

  const key = ["chat", userId, agentId ?? "general"];
  const res = await kv.get<{ messages: unknown[] }>(key);

  return res.value?.messages ?? [];
};
