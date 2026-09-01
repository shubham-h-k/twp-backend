import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { API_MESSAGES } from "../constants/api.messages";

export async function signup(req: Request, res: Response) {
  // 1. pull email, password, name, role from req.body
  const { email, password, name, role, organization } = req.body || {};

  if (!email || !password || !name || !role) {
    return res.status(400).json({ message: API_MESSAGES.MISSING_FIELDS });
  }

  try {
    // 2. hash the password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // TEMPORARY: accepting organization from the client is a mass-assignment
    // vulnerability — any user could assign themselves to any tenant.
    // Replace with: signup becomes protected, organization inherited from req.user.
    // Tracked for the seed-script work.

    // 3. create the user with User.create()
    const user = await User.create({
      name,
      email,
      password: hash,
      role,
      organization,
    });

    // 4. send back a response
    res
      .status(201)
      .json({ message: API_MESSAGES.USER_CREATED, userId: user._id });
  } catch (err) {
    if (
      err !== null &&
      typeof err === "object" &&
      "code" in err &&
      err.code === 11000
    ) {
      return res.status(409).json({ message: API_MESSAGES.DUPLICATE_EMAIL });
    }
    console.error(err);
    res.status(500).json({ message: API_MESSAGES.SERVER_ERROR });
  }
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: API_MESSAGES.MISSING_FIELDS });
  }

  try {
    const user = await User.findOne({ email }).select("+password");

    if (!user || !user.password) {
      return res
        .status(401)
        .json({ message: API_MESSAGES.INVALID_CREDENTIALS });
    }

    const matched = await bcrypt.compare(password, user.password);

    if (!matched) {
      return res
        .status(401)
        .json({ message: API_MESSAGES.INVALID_CREDENTIALS });
    }

    const payload = {
      userId: user._id,
      role: user.role,
      organization: user.organization,
    };

    const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: "1d" });

    return res.status(200).json({
      message: API_MESSAGES.LOGIN_SUCCESS,
      token,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: API_MESSAGES.SERVER_ERROR });
  }
}

export async function getMe(req: Request, res: Response) {
  res.status(200).json({ user: req.user });
}
