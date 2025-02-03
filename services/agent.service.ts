import { Context, Request } from "https://deno.land/x/oak@v17.1.4/mod.ts";
import { getUserIdFromRequest } from "./auth.service.ts";
import { checkAnonReqCount } from "./redis.service.ts";
import { Status } from "https://deno.land/x/oak@v17.1.4/deps.ts";

const kv = await Deno.openKv();
const getMainConfigKey = (userId: string) => [
  "agent-configuration",
  userId,
  "main",
];

export const getAgent = async (ctx: Context) => {
  let userId = ctx.state.userId;

  if (!userId) {
    userId = ctx.request.ip;
    await checkAnonReqCount(ctx.request.ip);
  }

  const agent = await kv.get<AgentConfiguration>(getMainConfigKey(userId));

  ctx.response.body = agent.value;
};

interface AgentConfiguration {
  name: string;
  description: string;
  systemMessage?: string;
  lore?: string;
  createdAt: number;
}

export const createAgent = async (ctx: Context) => {
  try {
    let userId = ctx.state.userId;

    if (!userId) {
      userId = ctx.request.ip;
      await checkAnonReqCount(ctx.request.ip);
    }

    const body = await ctx.request.body.json();
    const configuration = {
      name: body.name,
      description: body.description,
      systemMessage: body.systemMessage,
      lore: body.lore,
      createdAt: Date.now(),
    } satisfies AgentConfiguration;

    const response = await kv.set(getMainConfigKey(userId), configuration);

    if (!response.ok) throw new Error("Failed to create agent");

    ctx.response.status = Status.Created;
    ctx.response.body = response;
  } catch (error) {
    console.error("Unable to save agent configuration", error);

    let content = "Unable to create agent configuration";
    if (error instanceof Error) content += `. ${error.message}`;

    ctx.response.status = Status.Created;
    ctx.response.body = {
      role: "system",
      content,
      timestamp: Date.now(),
    };
  }
};

interface AgentDeployment {
  discord: {
    botToken: string;
  };
}
export const deployAgent = async (ctx: Context) => {
  const userId = ctx.state.userId;

  if (!userId) {
    throw new Error("Must be logged in to deploy agent");
  }

  const body = await ctx.request.body.json();
  const payload = {
    discord: {
      botToken: body.discordBotToken,
    },
  } satisfies AgentDeployment;

  ctx.response.body = await kv.set(["agent-deploy", userId, "main"], payload);
};
