import "jsr:@std/dotenv/load";
import { PrivyClient } from "@privy-io/server-auth";
import { Request } from "https://deno.land/x/oak@v17.1.4/mod.ts";
import { decodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";

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

const expectedUsername = Deno.env.get("N8N_DOVA_WEBHOOK_USER");
const expectedPassword = Deno.env.get("N8N_DOVA_WEBHOOK_PASSWORD");
if (!expectedUsername || !expectedPassword)
  throw new Error("N8N credentials are missing!");

export function checkBasicAuth(req: Request) {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader) {
    return false; // No Authorization header provided
  }

  const [authType, credentials] = authHeader.split(" ");

  if (authType !== "Basic") {
    return false; // Not Basic Authentication
  }

  try {
    const decodedCredentials = new TextDecoder().decode(
      decodeBase64(credentials)
    );
    const [username, password] = decodedCredentials.split(":");

    return username === expectedUsername && password === expectedPassword;
  } catch (error) {
    console.error("Error decoding credentials:", error);
    return false; // Invalid base64 encoding or other error
  }
}
