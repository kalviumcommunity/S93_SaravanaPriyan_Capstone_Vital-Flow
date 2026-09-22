import { connectToMongoDB } from "@/lib/mongodb.server";
import { PatientModel, type Patient } from "@/models/Patient.server";

const BLOOD_GROUPS = new Set(["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]);

type PatientRecord = Patient & {
  _id: unknown;
  createdAt: Date;
  updatedAt: Date;
};

export interface PatientInput {
  patientId: string;
  bloodGroup: string;
  ward: string;
  contact: string;
  notes?: string;
}

export class PatientValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PatientValidationError";
  }
}

export function validatePatientInput(input: PatientInput): PatientInput {
  const patientId = input.patientId.trim();
  const bloodGroup = input.bloodGroup.trim();
  const ward = input.ward.trim();
  const contact = input.contact.trim();
  const notes = input.notes?.trim();

  if (!patientId || !/^PT-[A-Za-z0-9-]+$/.test(patientId)) {
    throw new PatientValidationError(
      "Patient ID must start with PT- and contain only letters, numbers, or hyphens.",
    );
  }

  if (!BLOOD_GROUPS.has(bloodGroup)) {
    throw new PatientValidationError("A valid blood group is required.");
  }

  if (!ward) {
    throw new PatientValidationError("Ward / location is required.");
  }

  if (!contact) {
    throw new PatientValidationError("Emergency contact is required.");
  }

  return notes
    ? { patientId, bloodGroup, ward, contact, notes }
    : { patientId, bloodGroup, ward, contact };
}

function serializePatient(patient: PatientRecord) {
  return {
    id: String(patient._id),
    patientId: patient.patientId,
    bloodGroup: patient.bloodGroup,
    ward: patient.ward,
    contact: patient.contact,
    ...(patient.notes ? { notes: patient.notes } : {}),
    createdAt: patient.createdAt,
    updatedAt: patient.updatedAt,
  };
}

export async function listPatients() {
  await connectToMongoDB();
  const patients = await PatientModel.find().sort({ updatedAt: -1 }).lean();
  return patients.map((patient) => serializePatient(patient as PatientRecord));
}

export async function findPatientById(patientId: string) {
  await connectToMongoDB();
  const patient = await PatientModel.findOne({ patientId: patientId.trim() }).lean();
  return patient ? serializePatient(patient as PatientRecord) : null;
}

export async function createPatient(input: PatientInput) {
  const data = validatePatientInput(input);
  await connectToMongoDB();
  const patient = await PatientModel.create(data);
  return serializePatient(patient.toObject() as PatientRecord);
}

export async function updatePatient(
  patientId: string,
  input: Omit<PatientInput, "patientId">,
) {
  const normalizedId = patientId.trim();
  if (!/^PT-[A-Za-z0-9-]+$/.test(normalizedId)) {
    throw new PatientValidationError("Invalid patient ID.");
  }

  const data = validatePatientInput({ patientId: normalizedId, ...input });
  await connectToMongoDB();
  const patient = await PatientModel.findOneAndUpdate(
    { patientId: normalizedId },
    {
      $set: {
        bloodGroup: data.bloodGroup,
        ward: data.ward,
        contact: data.contact,
        notes: data.notes,
      },
    },
    { new: true, runValidators: true },
  ).lean();

  return patient ? serializePatient(patient as PatientRecord) : null;
}

export async function deletePatient(patientId: string) {
  const normalizedId = patientId.trim();
  if (!/^PT-[A-Za-z0-9-]+$/.test(normalizedId)) {
    throw new PatientValidationError("Invalid patient ID.");
  }

  await connectToMongoDB();
  const result = await PatientModel.deleteOne({ patientId: normalizedId });
  return result.deletedCount > 0;
}
