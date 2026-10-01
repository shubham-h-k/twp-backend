import mongoose from "mongoose";
import { env } from "../src/config/env";
import Employee from "../src/models/Employee";

async function main() {
  try {
    await mongoose.connect(env.MONGO_URI);
    await Employee.syncIndexes();
    console.log(await Employee.listIndexes());
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main();
