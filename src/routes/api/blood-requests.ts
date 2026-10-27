import { createFileRoute } from "@tanstack/react-router";
import { connectToMongoDB } from "@/lib/mongodb.server";
import { BloodRequestModel } from "@/models/BloodRequest.server";
import { PatientModel } from "@/models/Patient.server";

const bloodGroups = new Set(["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]);
const urgencies = new Set(["critical", "urgent", "standard"]);

function errorResponse(error: unknown) {
  if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
    return Response.json({ error: "A request with this ID already exists." }, { status: 409 });
  }
  console.error("Blood request API error:", error);
  return Response.json({ error: "Unable to access blood request data." }, { status: 503 });
}

export const Route = createFileRoute("/api/blood-requests")({
  server: {
    handlers: {
      GET: async () => {
        try {
          await connectToMongoDB();
          const requests = await BloodRequestModel.find()
            .populate("patient", "patientId bloodGroup ward contact")
            .sort({ createdAt: -1 })
            .lean();
          return Response.json({ requests });
        } catch (error) {
          return errorResponse(error);
        }
      },
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as Record<string, unknown>;
          const patientId = String(body.patientId ?? "").trim();
          const requestId = String(body.requestId ?? "").trim();
          const bloodGroup = String(body.bloodGroup ?? "").trim();
          const urgency = String(body.urgency ?? "").trim();
          const unitsNeeded = Number(body.unitsNeeded);
          const ward = String(body.ward ?? "").trim();
          const contact = String(body.contact ?? "").trim();
          const notes = typeof body.notes === "string" ? body.notes.trim() : "";

          if (!patientId || !requestId || !bloodGroups.has(bloodGroup) || !urgencies.has(urgency) ||
              !Number.isInteger(unitsNeeded) || unitsNeeded < 1 || !ward || !contact) {
            return Response.json({ error: "Valid patient, request, blood group, units, urgency, ward and contact are required." }, { status: 400 });
          }

          await connectToMongoDB();
          const patient = await PatientModel.findOne({ patientId }).select("_id");
          if (!patient) {
            return Response.json({ error: "Create the patient record before saving its blood request." }, { status: 404 });
          }

          const bloodRequest = await BloodRequestModel.create({
            patient: patient._id, requestId, bloodGroup, unitsNeeded, urgency, ward, contact,
            ...(notes ? { notes } : {}),
          });
          await bloodRequest.populate("patient", "patientId bloodGroup ward contact");
          return Response.json({ request: bloodRequest }, { status: 201 });
        } catch (error) {
          return errorResponse(error);
        }
      },
    },
  },
});
