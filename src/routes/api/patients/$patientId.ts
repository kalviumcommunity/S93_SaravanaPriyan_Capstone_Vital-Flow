import { createFileRoute } from "@tanstack/react-router";
import {
  deletePatient,
  findPatientById,
  PatientValidationError,
  updatePatient,
} from "@/server/patients.server";

function errorResponse(error: unknown) {
  if (error instanceof PatientValidationError) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  console.error("Patient API error:", error);
  return Response.json({ error: "Unable to access patient data." }, { status: 503 });
}

export const Route = createFileRoute("/api/patients/$patientId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        try {
          const patient = await findPatientById(params.patientId);
          if (!patient) {
            return Response.json({ error: "Patient not found." }, { status: 404 });
          }
          return Response.json({ patient });
        } catch (error) {
          return errorResponse(error);
        }
      },
      PUT: async ({ request, params }) => {
        try {
          const body = (await request.json()) as Record<string, unknown>;
          const patient = await updatePatient(params.patientId, {
            bloodGroup: String(body.bloodGroup ?? ""),
            ward: String(body.ward ?? ""),
            contact: String(body.contact ?? ""),
            ...(typeof body.notes === "string" ? { notes: body.notes } : {}),
          });
          if (!patient) {
            return Response.json({ error: "Patient not found." }, { status: 404 });
          }
          return Response.json({ patient });
        } catch (error) {
          return errorResponse(error);
        }
      },
      DELETE: async ({ params }) => {
        try {
          const deleted = await deletePatient(params.patientId);
          if (!deleted) {
            return Response.json({ error: "Patient not found." }, { status: 404 });
          }
          return Response.json({ success: true });
        } catch (error) {
          return errorResponse(error);
        }
      },
    },
  },
});
