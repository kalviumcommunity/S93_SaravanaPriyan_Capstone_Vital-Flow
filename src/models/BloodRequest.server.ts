import mongoose, { type InferSchemaType } from "mongoose";

const bloodRequestSchema = new mongoose.Schema(
  {
    // Many blood requests can belong to one patient.
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    requestId: { type: String, required: true, unique: true, trim: true },
    bloodGroup: {
      type: String,
      required: true,
      enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
    },
    unitsNeeded: { type: Number, required: true, min: 1 },
    urgency: { type: String, required: true, enum: ["critical", "urgent", "standard"] },
    ward: { type: String, required: true, trim: true },
    contact: { type: String, required: true, trim: true },
    notes: { type: String, trim: true },
    state: {
      type: String,
      required: true,
      enum: ["SEARCHING", "APPROVED", "FULFILLED", "CANCELLED"],
      default: "SEARCHING",
    },
  },
  { timestamps: true },
);

export type BloodRequest = InferSchemaType<typeof bloodRequestSchema>;

export const BloodRequestModel =
  (mongoose.models.BloodRequest as mongoose.Model<BloodRequest> | undefined) ??
  mongoose.model<BloodRequest>("BloodRequest", bloodRequestSchema);
