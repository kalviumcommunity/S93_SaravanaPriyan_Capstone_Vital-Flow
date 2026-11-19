import { createFileRoute } from "@tanstack/react-router";
import { getSession } from "@/server/auth.server";

export const Route = createFileRoute("/api/auth/me")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = getSession(request);
        if (!user) return Response.json({ user: null }, { status: 401 });
        return Response.json({ user });
      },
    },
  },
});
