import express, { NextFunction, Request, Response, Router } from "express";
import authRoutes from "./routes/auth.routes";
import applicationRoutes from "./routes/application.routes";
import { API_MESSAGES } from "./constants/api.messages";

const app = express();
app.use(express.json());

app.disable("x-powered-by");

app.get("/", (_req, res) => {
  res.send("TWP backend is running");
});

const apiRouter = Router();

apiRouter.use("/auth", authRoutes);
apiRouter.use("/applications", applicationRoutes);

app.use("/api/v1", apiRouter);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ message: API_MESSAGES.SERVER_ERROR });
});

export default app;
