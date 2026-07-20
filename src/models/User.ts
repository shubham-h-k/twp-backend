import mongoose from "mongoose";

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
    role: { type: String, required: true, enum: ["org_staff", "caseworker"] },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization" },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
