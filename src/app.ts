import express, { NextFunction, Request, Response } from "express";
import authRoutes from "./routes/auth.routes";
import { API_MESSAGES } from "./constants/api.messages";

const app = express();
app.use(express.json());

app.disable("x-powered-by");

app.get("/", (_req, res) => {
  res.send("TWP backend is running");
});

app.use("/api/v1/auth", authRoutes);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ message: API_MESSAGES.SERVER_ERROR });
});

export default app;
