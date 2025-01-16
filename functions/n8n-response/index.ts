import { Request } from "https://deno.land/x/oak@v17.1.4/mod.ts";

export const processN8nResponse = (req: Request) => {
  const token = req.headers.get("x-ghost-token");
  if (!token) throw "invalid request";

  console.log(req, typeof req.body, typeof req.body.json);
  return {
    ok: true,
  };
};
