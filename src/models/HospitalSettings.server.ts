import mongoose, { type InferSchemaType } from "mongoose";

const hospitalSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "primary" },
    name: { type: String, required: true, trim: true, default: "St. Marian General Hospital" },
    regno: { type: String, trim: true, default: "HSP-2291-KA" },
    licence: { type: String, trim: true, default: "BB/LIC/2024/0918" },
    address: { type: String, trim: true, default: "18 Richmond Road, Bengaluru" },
    pin: { type: String, trim: true, default: "560025" },
    contact: { type: String, trim: true, default: "+91 9845012300" },
    autoRepush: { type: Boolean, default: true },
    notifyDesk: { type: Boolean, default: true },
    includeWardDetails: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "hospitalsettings" },
);

export type HospitalSettings = InferSchemaType<typeof hospitalSettingsSchema>;

export const HospitalSettingsModel =
  (mongoose.models["HospitalSettings"] as mongoose.Model<HospitalSettings> | undefined) ??
  mongoose.model<HospitalSettings>("HospitalSettings", hospitalSettingsSchema);
