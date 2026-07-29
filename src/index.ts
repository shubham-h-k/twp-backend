import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/User";
import jwt from "jsonwebtoken";

dotenv.config();

const PORT = process.env.PORT || 5001;
const secret = process.env.JWT_SECRET;

if (!secret) {
  console.error("JWT_SECRET is not defined in .env");
  process.exit(1);
}

const app = express();

app.use(express.json());

app.get("/", (_req, res) => {
  res.send("TWP backend is running");
});

app.post("/signup", async (req, res) => {
  // 1. pull email, password, name, role from req.body
  const { email, password, name, role } = req.body;

  if (!email || !password || !name || !role) {
    return res.status(400).json({ message: "Missing required field" });
  }

  try {
    // 2. hash the password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // 3. create the user with User.create()
    const user = await User.create({ name, email, password: hash, role });

    // 4. send back a response
    res.status(201).json({ message: "User created", userId: user._id });
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Email already registered" });
    }
    console.error(err);
    res.status(500).json({ message: "Something went wrong" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Missing required field" });
  }

  try {
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const matched = await bcrypt.compare(password, user.password);

    if (!matched) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const payload = {
      userId: user._id,
      role: user.role,
      organization: user.organization,
    };

    const token = jwt.sign(payload, secret, { expiresIn: "1d" });

    return res.status(200).json({
      message: "Login successful",
      token,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Something went wrong" });
  }
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
