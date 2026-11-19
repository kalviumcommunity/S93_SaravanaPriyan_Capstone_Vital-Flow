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

type DonorForSerialization = {
  id: string;
  name: string;
  bloodGroup: string;
  distanceKm: number;
  phone: string;
  lastDonation: string;
  state: string;
  pushCount: number;
  etaMinutes?: number | null;
};

type RequestForSerialization = {
  requestId: string;
  createdAt: Date;
  bloodGroup: string;
  unitsNeeded: number;
  urgency: string;
  patient: { patientId?: string } | null;
  ward: string;
  contact: string;
  notes?: string;
  state: string;
  donors?: DonorForSerialization[];
};

function serializeRequest(request: RequestForSerialization) {
  const patient = request.patient && typeof request.patient === "object" ? request.patient : null;

  return {
    id: request.requestId,
    requestId: request.requestId,
    createdAt: request.createdAt,
    bloodGroup: request.bloodGroup,
    unitsNeeded: request.unitsNeeded,
    urgency: request.urgency,
    patientId: patient?.patientId ?? "",
    ward: request.ward,
    contact: request.contact,
    notes: request.notes ?? "",
    state: request.state,
    donors: (request.donors ?? []).map((donor) => ({
      id: donor["id"],
      name: donor["name"],
      bloodGroup: donor["bloodGroup"],
      distanceKm: donor["distanceKm"],
      phone: donor["phone"],
      lastDonation: donor["lastDonation"],
      state: donor.state,
      pushCount: donor.pushCount,
      ...(donor.etaMinutes == null ? {} : { etaMinutes: donor.etaMinutes }),
    })),
  };
}

export const Route = createFileRoute("/api/blood-requests")({
  server: {
    handlers: {
      GET: async () => {
        try {
          await connectToMongoDB();
          const requests = await BloodRequestModel.find()
            .populate("patient", "patientId")
            .sort({ createdAt: -1 })
            .lean();
          return Response.json({
            requests: requests.map((request) =>
              serializeRequest(request as unknown as RequestForSerialization),
            ),
          });
        } catch (error) {
          return errorResponse(error);
        }
      },
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as Record<string, unknown>;
          const patientId = String(body["patientId"] ?? "").trim();
          const requestId = String(body["requestId"] ?? "").trim();
          const bloodGroup = String(body["bloodGroup"] ?? "").trim();
          const urgency = String(body["urgency"] ?? "").trim();
          const unitsNeeded = Number(body["unitsNeeded"]);
          const ward = String(body["ward"] ?? "").trim();
          const contact = String(body["contact"] ?? "").trim();
          const notes = typeof body["notes"] === "string" ? body["notes"].trim() : "";
          const state = String(body["state"] ?? "SEARCHING");
          const donors = Array.isArray(body["donors"])
            ? (body["donors"] as Record<string, unknown>[])
            : [];

          if (
            !patientId ||
            !requestId ||
            !bloodGroups.has(bloodGroup) ||
            !urgencies.has(urgency) ||
            !Number.isInteger(unitsNeeded) ||
            unitsNeeded < 1 ||
            !ward ||
            !contact
          ) {
            return Response.json(
              {
                error:
                  "Valid patient, request, blood group, units, urgency, ward and contact are required.",
              },
              { status: 400 },
            );
          }

          await connectToMongoDB();
          const patient = await PatientModel.findOne({ patientId }).select("_id");
          if (!patient) {
            return Response.json(
              { error: "Create the patient record before saving its blood request." },
              { status: 404 },
            );
          }

          const bloodRequest = await BloodRequestModel.create({
            patient: patient._id,
            requestId,
            bloodGroup,
            unitsNeeded,
            urgency,
            ward,
            contact,
            state: state === "SEARCHING" ? state : "SEARCHING",
            donors: donors.map((donor) => ({
              id: String(donor["id"] ?? ""),
              name: String(donor["name"] ?? "Registered Donor"),
              bloodGroup: String(donor["bloodGroup"] ?? bloodGroup),
              distanceKm: Number(donor["distanceKm"] ?? 0),
              phone: String(donor["phone"] ?? ""),
              lastDonation: String(donor["lastDonation"] ?? "Not available"),
              state: "MATCHED",
              pushCount: 1,
            })),
            ...(notes ? { notes } : {}),
          });

          await bloodRequest.populate("patient", "patientId");
          return Response.json(
            {
              request: serializeRequest(
                bloodRequest.toObject() as unknown as RequestForSerialization,
              ),
            },
            { status: 201 },
          );
        } catch (error) {
          return errorResponse(error);
        }
      },
      PATCH: async ({ request }) => {
        try {
          const body = (await request.json()) as Record<string, unknown>;
          const requestId = String(body["requestId"] ?? "").trim();
          const action = String(body["action"] ?? "");
          const donorId = String(body["donorId"] ?? "");

          if (!requestId || !["repush", "approve", "received", "cancel"].includes(action)) {
            return Response.json(
              { error: "A valid request ID and action are required." },
              { status: 400 },
            );
          }

          await connectToMongoDB();
          const bloodRequest = await BloodRequestModel.findOne({ requestId }).populate(
            "patient",
            "patientId",
          );
          if (!bloodRequest) {
            return Response.json({ error: "Blood request not found." }, { status: 404 });
          }

          if (action === "cancel") {
            bloodRequest.state = "CANCELLED";
          } else {
            const donor = bloodRequest.donors.find((item) => item.id === donorId);
            if (!donor) {
              return Response.json({ error: "Donor not found for this request." }, { status: 404 });
            }

            if (action === "repush") {
              donor.pushCount += 1;
              donor.state = "MATCHED";
            } else if (action === "approve") {
              donor.state = "APPROVED";
              donor.etaMinutes = Math.max(6, Math.round(donor["distanceKm"] * 4));
              if (bloodRequest.state === "SEARCHING") bloodRequest.state = "APPROVED";
            } else if (action === "received") {
              donor.state = "DONATED";
              const donatedUnits = bloodRequest.donors.filter(
                (item) => item.state === "DONATED",
              ).length;
              if (donatedUnits >= bloodRequest.unitsNeeded) bloodRequest.state = "FULFILLED";
            }
          }

          await bloodRequest.save();
          await bloodRequest.populate("patient", "patientId");
          return Response.json({
            request: serializeRequest(
              bloodRequest.toObject() as unknown as RequestForSerialization,
            ),
          });
        } catch (error) {
          return errorResponse(error);
        }
      },
    },
  },
});
