import Redis from "ioredis";
import { configDotenv } from "dotenv";
configDotenv();

const client = new Redis(process.env.UPSTASH_REDIS_URL);

export default client;
//Shortest possible answer

//new Redis(url) creates a connection to your Redis database and returns an object you can use to send commands.

// 1) Redis = a blueprint
//2) we use 'new' keyword with Redis and call it , it return an object then we store that object in client
//3) client = an actual object created from blueprint
//4) client have now different method like (set,get,etc.) to perform actions on redis database
