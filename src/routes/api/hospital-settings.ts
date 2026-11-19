import { createFileRoute } from "@tanstack/react-router";
import { connectToMongoDB } from "@/lib/mongodb.server";
import { HospitalSettingsModel } from "@/models/HospitalSettings.server";

const DEFAULT_SETTINGS = {
  name: "St. Marian General Hospital",
  regno: "HSP-2291-KA",
  licence: "BB/LIC/2024/0918",
  address: "18 Richmond Road, Bengaluru",
  pin: "560025",
  contact: "+91 9845012300",
  autoRepush: true,
  notifyDesk: true,
  includeWardDetails: false,
};

function toResponse(settings: Record<string, unknown>) {
  return {
    name: settings.name,
    regno: settings.regno,
    licence: settings.licence,
    address: settings.address,
    pin: settings.pin,
    contact: settings.contact,
    autoRepush: settings.autoRepush,
    notifyDesk: settings.notifyDesk,
    includeWardDetails: settings.includeWardDetails,
  };
}

export const Route = createFileRoute("/api/hospital-settings")({
  server: {
    handlers: {
      GET: async () => {
        try {
          await connectToMongoDB();
          const saved = await HospitalSettingsModel.findOne({ key: "primary" }).lean().exec();
          return Response.json(toResponse({ ...DEFAULT_SETTINGS, ...(saved ?? {}) }));
        } catch (error) {
          console.error("Hospital settings GET error:", error);
          return Response.json({ error: "Unable to load hospital settings." }, { status: 503 });
        }
      },
      PUT: async ({ request }) => {
        try {
          const body = (await request.json()) as Record<string, unknown>;
          const textFields = ["name", "regno", "licence", "address", "pin", "contact"] as const;
          const booleanFields = ["autoRepush", "notifyDesk", "includeWardDetails"] as const;
          const updates: Record<string, string | boolean> = {};

          for (const field of textFields) {
            if (typeof body[field] !== "string" || !body[field].trim()) {
              return Response.json({ error: `${field} is required.` }, { status: 400 });
            }
            updates[field] = body[field].trim();
          }
          for (const field of booleanFields) {
            if (typeof body[field] !== "boolean") {
              return Response.json({ error: `${field} must be true or false.` }, { status: 400 });
            }
            updates[field] = body[field];
          }

          await connectToMongoDB();
          const saved = await HospitalSettingsModel.findOneAndUpdate(
            { key: "primary" },
            { $set: updates, $setOnInsert: { key: "primary" } },
            { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
          )
            .lean()
            .exec();

          return Response.json({ success: true, settings: toResponse(saved ?? {}) });
        } catch (error) {
          console.error("Hospital settings PUT error:", error);
          return Response.json({ error: "Unable to save hospital settings." }, { status: 503 });
        }
      },
    },
  },
});
