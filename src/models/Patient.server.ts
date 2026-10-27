import mongoose, { type InferSchemaType } from "mongoose";

const patientSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    bloodGroup: {
      type: String,
      required: true,
      enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
    },
    ward: {
      type: String,
      required: true,
      trim: true,
    },
    contact: {
      type: String,
      required: true,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

// One patient can have many blood requests. BloodRequest stores the actual reference.
patientSchema.virtual("bloodRequests", {
  ref: "BloodRequest",
  localField: "_id",
  foreignField: "patient",
});

export type Patient = InferSchemaType<typeof patientSchema>;

export const PatientModel =
  (mongoose.models.Patient as mongoose.Model<Patient> | undefined) ??
  mongoose.model<Patient>("Patient", patientSchema);
