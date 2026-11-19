import mongoose, { type InferSchemaType } from "mongoose";

const donorSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    bloodGroup: {
      type: String,
      required: true,
      enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
    },
    distanceKm: { type: Number, required: true, min: 0 },
    phone: { type: String, required: true },
    lastDonation: { type: String, required: true },
    state: {
      type: String,
      required: true,
      enum: ["MATCHED", "APPROVED", "DECLINED", "DONATED"],
      default: "MATCHED",
    },
    pushCount: { type: Number, required: true, min: 1, default: 1 },
    etaMinutes: { type: Number, min: 0 },
  },
  { _id: false },
);

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
    donors: { type: [donorSchema], default: [] },
  },
  { timestamps: true },
);

export type BloodRequest = InferSchemaType<typeof bloodRequestSchema>;

export const BloodRequestModel =
  (mongoose.models["BloodRequest"] as mongoose.Model<BloodRequest> | undefined) ??
  mongoose.model<BloodRequest>("BloodRequest", bloodRequestSchema);
