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

// 404 handler - runs when no route matched
app.use((_req, res) => {
  res.status(404).json({ message: API_MESSAGES.ROUTE_NOT_FOUND });
});

// global error handler — must stay last
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);

  const status =
    err !== null &&
    typeof err === "object" &&
    "status" in err &&
    typeof err.status === "number"
      ? err.status
      : 500;

  res.status(status).json({
    message:
      status >= 500 ? API_MESSAGES.SERVER_ERROR : API_MESSAGES.INVALID_INPUT,
  });
  res.status(500).json({ message: API_MESSAGES.SERVER_ERROR });
});

export default app;
