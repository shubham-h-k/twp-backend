import { NextFunction, Request, Response } from "express";
import { AuthPayload } from "../types/auth";
import { API_MESSAGES } from "../constants/api.messages";

export function requireRole(...roles: AuthPayload["role"][]) {
  // this outer function runs ONCE, when you set up the route
  return function (req: Request, res: Response, next: NextFunction) {
    // this inner function is the actual middleware — runs on every request
    // and it can "see" the `role` from the outer function's scope
    if (!req.user) {
      return res.status(401).json({ message: API_MESSAGES.UNAUTHORIZED });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: API_MESSAGES.FORBIDDEN });
    }
    next();
  };
}
