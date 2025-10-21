import Redis from "ioredis";
import { configDotenv } from "dotenv";
configDotenv();

const client = new Redis(process.env.UPSTASH_REDIS_URL);
await client.set("foo", "bar");
export default client;
