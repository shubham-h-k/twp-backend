import mongoose from "mongoose";
import { ROLES } from "../constants/roles";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    role: { type: String, required: true, enum: ROLES },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization" },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
