import { createClient } from "jsr:@supabase/supabase-js@2";
import { Database } from "./database.types.ts";

const supabase = createClient<Database>(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_KEY")!
);

export const createMessage = (payload: {
  userId: string;
  agentId?: string;
  messageId?: string;
  content: string;
  sender: string;
}) =>
  supabase
    .from("message")
    .insert({
      messageId: payload.messageId,
      content: payload.content,
      sender: payload.sender,
      userId: payload.userId,
      agentId: payload.agentId,
    })
    .select("id");

export const getMessages = (userId: string, _agentId: string | null) =>
  supabase.from("message").select("*").eq("userId", userId);

export const getMessageById = (userId: string, messageId: number) =>
  supabase
    .from("message")
    .select("*")
    .eq("userId", userId)
    .eq("id", messageId)
    .single();
