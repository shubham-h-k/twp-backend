import dotenv from "dotenv";

dotenv.config();

const PORT = Number(process.env.PORT) || 5001;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

if (!MONGO_URI) {
  console.error("MONGO_URI is not defined in .env");
  process.exit(1);
}

if (!JWT_SECRET) {
  console.error("JWT_SECRET is not defined in .env");
  process.exit(1);
}

export const env = { PORT, JWT_SECRET, MONGO_URI };
