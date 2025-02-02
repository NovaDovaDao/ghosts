import { connect } from "https://deno.land/x/redis@v0.37.1/redis.ts";

const hostname = Deno.env.get("REDIS_HOSTNAME");
const port = Deno.env.get("REDIS_PORT");
const password = Deno.env.get("REDIS_PASSWORD");
const MAX_ANON_REQ = 10;

if (!hostname || !port || !password) throw "Missing Redis credentials";

export const requireRedis = () =>
  connect({
    hostname,
    port,
    password,
  });

export const checkAnonReqCount = async (ipAddress: string) => {
  const redis = await requireRedis();
  const key = `anon-req-${ipAddress}`;

  try {
    // Increment the request count.  If the key doesn't exist, it's initialized to 0 before incrementing.
    const reqCount = await redis.incr(key);
    console.log("Anon request", ipAddress, reqCount);

    if (reqCount >= MAX_ANON_REQ) {
      throw new Error("Anonymous request limit exceeded.");
    }

    // Set an expiration time for the key (e.g., 24 hours).  This is important to prevent abuse.
    await redis.expire(key, 24 * 60 * 60); // 24 hours in seconds

    return reqCount; // Return the current request count (optional)
  } finally {
    redis.close(); // Always close the Redis connection in a finally block
  }
};
