import { Request } from "https://deno.land/x/oak@v17.1.4/mod.ts";
import { getUserIdFromRequest } from "./auth.service.ts";

const kv = await Deno.openKv();
const getMainKey = (userId: string) => ["agent-configuration", userId, "main"];

export const getAgent = async (req: Request) => {
  const { userId } = await getUserIdFromRequest(req);

  const agent = await kv.get<AgentConfiguration>(getMainKey(userId));

  return agent.value;
};

interface AgentConfiguration {
  name: string;
  description: string;
  createdAt: number;
}

export const createAgent = async (req: Request) => {
  const { userId } = await getUserIdFromRequest(req);

  const body = await req.body.json();
  const configuration = {
    name: body.name,
    description: body.description,
    createdAt: Date.now(),
  } satisfies AgentConfiguration;

  const response = await kv.set(getMainKey(userId), configuration);

  if (!response.ok) throw new Error("Failed to create agent");

  return configuration;
};
