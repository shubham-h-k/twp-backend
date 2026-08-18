import express, { NextFunction, Request, Response } from "express";
import authRoutes from "./routes/auth.routes";

const app = express();
app.use(express.json());

app.disable("x-powered-by");

app.get("/", (_req, res) => {
  res.send("TWP backend is running");
});

app.use("/api/v1/auth", authRoutes);

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ message: "Something went wrong" });
});

export default app;
