import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AuthPayload } from "../types/auth";
import { API_MESSAGES } from "../constants/api.messages";

// requireAuth function's job is to verify token
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // 1. read the Authorization header, extract the token
  const authHeader = req.headers.authorization;

  // 2. if no token → 401
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: API_MESSAGES.UNAUTHORIZED });
  }

  const token = authHeader.split(" ")[1];

  // 3. jwt.verify(token, secret) inside try/catch
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.user = payload as AuthPayload;
    next();
  } catch (err) {
    return res.status(401).json({ message: API_MESSAGES.UNAUTHORIZED });
  }
}
