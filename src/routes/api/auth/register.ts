import { createFileRoute } from "@tanstack/react-router";
import { createSessionCookie, registerUser } from "@/server/auth.server";

export const Route = createFileRoute("/api/auth/register")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { username?: unknown; password?: unknown };
          const user = await registerUser(body.username, body.password);
          return Response.json(
            { user },
            { status: 201, headers: { "Set-Cookie": createSessionCookie(user) } },
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unable to register.";
          const status = message.includes("already registered")
            ? 409
            : message.includes("Username") || message.includes("Password")
              ? 400
              : 503;
          if (status === 503) console.error("Registration failed:", error);
          return Response.json(
            { error: status === 503 ? "Unable to register right now." : message },
            { status },
          );
        }
      },
    },
  },
});
