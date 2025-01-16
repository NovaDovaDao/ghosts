import { Request } from "https://deno.land/x/oak@v17.1.4/mod.ts";
import { createMessage } from "../../db.ts";

export const processN8nResponse = async (req: Request) => {
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

  console.log("Saved message", responseData, responseError);

  return {
    status,
    statusText,
  };
};
