import { env } from "./config/env";
import { connectDB } from "./config/db";
import app from "./app";

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
