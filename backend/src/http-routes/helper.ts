import jwt from "jsonwebtoken";
import { prisma } from "../prisma";

export const generateAccessToken = (userId: string) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET!, {
    expiresIn: "1h",
  });
  return token;
};

export const generateRefreshToken = (userId: string) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });
  return token;
};

export const generateAccessTokenWithRefreshToken = async (userId: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);
    return { accessToken, refreshToken };
  } catch (error) {
    throw new Error("Internal Server Error");
  }
};
