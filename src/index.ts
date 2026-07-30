import { env } from "./config/env";
import express, { NextFunction, Request, Response } from "express";
import { connectDB } from "./config/db";
import authRoutes from "./routes/auth.routes";

const app = express();
app.use(express.json());

app.get("/", (_req, res) => {
  res.send("TWP backend is running");
});

app.use("/api/auth", authRoutes);

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ message: "Something went wrong" });
});

async function start(uri: string) {
  try {
    await connectDB(uri);
    app.listen(env.PORT, () => {
      console.log(`Server running on http://localhost:${env.PORT}`);
    });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

start(env.MONGO_URI);
