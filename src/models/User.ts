import mongoose from "mongoose";
import { ROLES } from "../constants/roles";
import { MODELS } from "../constants/models";

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
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: MODELS.ORGANIZATION,
    },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
