import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export interface AuthRequest extends Request {
  userId?: string;
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).send("Unauthorized");
      return;
    }
    const token = authHeader.split(" ")[1];
    console.log("token", token);
    jwt.verify(token, process.env.JWT_SECRET!, (err, decoded) => {
      if (err) {
        res.status(401).send("Unauthorized");
        return;
      }
      const decodedUserId = decoded as JwtPayload;

      req.userId = decodedUserId.userId;
      next();
    });
  } catch (error) {
    console.log("Internal Middleware Error", error);
  }
}
