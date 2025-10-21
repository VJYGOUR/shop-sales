import client from "../lib/redis.js";

const storeRefreshToken = async (userId, refreshToken) => {
  await client.set(
    `refresh_token:${userId}`,
    refreshToken,
    "EX",
    7 * 24 * 60 * 60
  );
};
export default storeRefreshToken;
