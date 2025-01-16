import { Sender } from "./types.ts";
import { PrismaClient } from "./generated/client/deno/edge.ts";

const prisma = new PrismaClient();

export const createMessage = (payload: {
  userId: string;
  agentId?: string;
  messageId: string;
  content: string;
  sender: Sender;
}) =>
  prisma.message.create({
    data: {
      messageId: payload.messageId,
      content: payload.content,
      sender: payload.sender,
      userId: payload.userId,
      agentId: payload.agentId,
    },
  });

export const getMessages = (userId: string, _agentId: string | null) =>
  prisma.message.findMany({ where: { userId }, take: 50 });
