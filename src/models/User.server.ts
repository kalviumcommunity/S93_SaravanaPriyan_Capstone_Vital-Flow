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
    passwordHash: { type: String, required: true },
    passwordSalt: { type: String, required: true },
  },
  { timestamps: true },
);

export type User = InferSchemaType<typeof userSchema>;

export const UserModel =
  (mongoose.models["User"] as mongoose.Model<User> | undefined) ??
  mongoose.model<User>("User", userSchema);
