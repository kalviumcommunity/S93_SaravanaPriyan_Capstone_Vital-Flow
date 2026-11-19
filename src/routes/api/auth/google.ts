import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/firebase-admin.server";
import { UserModel } from "@/models/User.server";
import { createSessionCookie } from "@/server/auth.server";

export const Route = createFileRoute("/api/auth/google")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { token?: string };
          const token = body.token;

          if (!token) {
            return Response.json({ error: "No token provided" }, { status: 400 });
          }

          // Verify token
          const decodedToken = await auth.verifyIdToken(token);
          const { uid, email, name } = decodedToken;

          // Find or create user
          let user = await UserModel.findOne({ googleId: uid });
          if (!user) {
            user = await UserModel.create({
              username: email ?? name ?? `user_${uid}`,
              googleId: uid,
            });
          }

          const userData = { id: String(user._id), username: user.username };

          return Response.json(
            { success: true, user: userData },
            { headers: { "Set-Cookie": createSessionCookie(userData) } }
          );
        } catch (err: any) {
          console.error("GOOGLE_AUTH_ERROR:", err);
          return Response.json(
            { error: `${err.message || "Unknown error"}` },
            { status: 401 }
          );
        }
      },
    },
  },
});

