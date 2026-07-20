import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.get("/", (_, res) => {
  res.send("TWP backend is running");
});

const MONGO_URI = process.env.MONGO_URI;

async function start(uri: string) {
  try {
    await mongoose.connect(uri);
    console.log("DB connected");
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error(err);
  }
}

if (!MONGO_URI) {
  console.error("MONGO_URI is not defined in .env");
  process.exit(1);
}

start(MONGO_URI);
