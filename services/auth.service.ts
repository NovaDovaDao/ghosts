import "jsr:@std/dotenv/load";
import { PrivyClient } from "@privy-io/server-auth";
import { Request } from "https://deno.land/x/oak@v17.1.4/mod.ts";

// Validate environment variables
const PRIVY_APP_ID = Deno.env.get("PRIVY_APP_ID");
const PRIVY_APP_SECRET = Deno.env.get("PRIVY_APP_SECRET");
if (!PRIVY_APP_ID || !PRIVY_APP_SECRET) {
  throw new Error(
    "Missing required environment variables: PRIVY_APP_ID and PRIVY_APP_SECRET must be set"
  );
}
const privy = new PrivyClient(PRIVY_APP_ID, PRIVY_APP_SECRET);

export const getUserIdFromRequest = async (req: Request) => {
  const token = req.headers.get("x-ghost-token");
  if (!token) return null;

  const verified = await privy.verifyAuthToken(token);

  return verified.userId;
};
