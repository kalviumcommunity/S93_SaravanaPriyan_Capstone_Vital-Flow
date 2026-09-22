import { createFileRoute } from "@tanstack/react-router";
import {
  createPatient,
  listPatients,
  PatientValidationError,
} from "@/server/patients.server";

function errorResponse(error: unknown) {
  if (error instanceof PatientValidationError) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
    return Response.json({ error: "A patient with this ID already exists." }, { status: 409 });
  }

  console.error("Patient API error:", error);
  return Response.json({ error: "Unable to access patient data." }, { status: 503 });
}

export const Route = createFileRoute("/api/patients")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const patients = await listPatients();
          return Response.json({ patients });
        } catch (error) {
          return errorResponse(error);
        }
      },
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as Record<string, unknown>;
          const input = {
            patientId: String(body.patientId ?? ""),
            bloodGroup: String(body.bloodGroup ?? ""),
            ward: String(body.ward ?? ""),
            contact: String(body.contact ?? ""),
            ...(typeof body.notes === "string" ? { notes: body.notes } : {}),
          };
          const patient = await createPatient(input);
          return Response.json({ patient }, { status: 201 });
        } catch (error) {
          return errorResponse(error);
        }
      },
    },
  },
});
