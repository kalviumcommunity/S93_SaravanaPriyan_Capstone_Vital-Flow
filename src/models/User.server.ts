import mongoose, { type InferSchemaType } from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 40,
    },
    // Make password fields optional for Google-authenticated users
    passwordHash: { type: String },
    passwordSalt: { type: String },
    // Add an optional googleId to identify Google users
    googleId: { type: String, unique: true, sparse: true },
  },
  { timestamps: true },
);

export type User = InferSchemaType<typeof userSchema>;

export const UserModel =
  (mongoose.models["User"] as mongoose.Model<User> | undefined) ??
  mongoose.model<User>("User", userSchema);
