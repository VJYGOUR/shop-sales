import jwt from "jsonwebtoken";
const generateToken = (userId) => {
  const accessToken = jwt.sign(
    { userId }, // payload
    process.env.ACCESS_TOKEN_SECRET, // secret key
    { expiresIn: "15m" } // token validity
  );
  const refreshToken = jwt.sign(
    { userId }, // payload
    process.env.REFRESH_TOKEN_SECRET, // secret key
    { expiresIn: "7d" } // token validity
  );
  return { accessToken, refreshToken };
};
export default generateToken;
