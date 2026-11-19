import { createFileRoute } from "@tanstack/react-router";
import { createSessionCookie, verifyUser } from "@/server/auth.server";

export const Route = createFileRoute("/api/auth/login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { username?: unknown; password?: unknown };
          const user = await verifyUser(body.username, body.password);
          if (!user)
            return Response.json({ error: "Invalid username or password." }, { status: 401 });
          return Response.json({ user }, { headers: { "Set-Cookie": createSessionCookie(user) } });
        } catch (error) {
          console.error("Login failed:", error);
          return Response.json(
            { error: "Unable to sign in right now. Check your database and server configuration." },
            { status: 503 },
          );
        }
      },
    },
  },
});
