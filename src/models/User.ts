import mongoose from "mongoose";
import { Role, ROLES } from "../constants/roles";
import { MODELS } from "../constants/models";

interface IUser {
  name: string;
  email: string;
  password?: string;
  role: Role;
  organization?: mongoose.Types.ObjectId;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
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

export default mongoose.model<IUser>(MODELS.USER, userSchema);
