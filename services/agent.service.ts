import { Context, RouterContext } from "https://deno.land/x/oak@v17.1.4/mod.ts";
import { checkAnonReqCount } from "./redis.service.ts";
import { Status } from "https://deno.land/x/oak@v17.1.4/deps.ts";

const kv = await Deno.openKv();
const AGENT_CONFIG = Symbol("agent-config");
const USER_AGENTS = Symbol("user-agents");

export const getAgent = async (ctx: Context) => {
  let userId = ctx.state.userId;

  if (!userId) {
    userId = ctx.request.ip;
    await checkAnonReqCount(ctx.request.ip);
  }

  const list = kv.list<AgentConfiguration>({ prefix: [AGENT_CONFIG, userId] });
  const agents: AgentConfiguration[] = [];

  for await (const item of list) {
    agents.push(item.value);
  }
  const [firstAgent] = agents;

  ctx.response.body = firstAgent;
};

export const getAgentById = async (ctx: Context) => {
  let userId = ctx.state.userId;
  console.log("is n8n request?", ctx.request.headers.get("Authorization"));

  if (!userId) {
    userId = ctx.request.ip;
    await checkAnonReqCount(ctx.request.ip);
  }

  // @ts-ignore i dunno
  const agentId = ctx.params.agentId;

  const agent = await kv.get<AgentConfiguration>([AGENT_CONFIG, agentId]);

  ctx.response.body = agent.value;
};

interface AgentConfiguration {
  userId: string;
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

    const agentId = crypto.randomUUID();

    const body = await ctx.request.body.json();
    const configuration = {
      userId,
      name: body.name,
      description: body.description,
      systemMessage: body.systemMessage,
      lore: body.lore,
      createdAt: Date.now(),
    } satisfies AgentConfiguration;

    await kv.set([AGENT_CONFIG, agentId], configuration);

    await kv.set([USER_AGENTS, userId, agentId], true);

    ctx.response.status = Status.Created;
    ctx.response.body = agentId;
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
