import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { LockKeyhole, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in · LifeLine Hospital Console" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleGoogleSignIn() {
    try {
      setGoogleLoading(true);
      setError("");
      // Dynamically import only in the browser context
      const { auth, googleProvider } = await import("@/lib/firebase");
      const { signInWithPopup } = await import("firebase/auth");

      if (!auth || !googleProvider) {
        throw new Error("Firebase not initialized.");
      }

      const result = await signInWithPopup(auth, googleProvider);

      // Extract the ID token and send it to your server to create a session
      const idToken = await result.user.getIdToken();

      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: idToken }),
      });

      if (!response.ok) {
        throw new Error("Failed to verify Google login with server.");
      }

      await navigate({ to: "/", replace: true });
    } catch (err) {
      console.error("Detailed Google Sign-In error:", err);
      setError(`Google Sign-In failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setGoogleLoading(false);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch(mode === "login" ? "/api/auth/login" : "/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Authentication failed.");
      await navigate({ to: "/", replace: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to continue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center p-4 text-foreground">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img src="/background.png" alt="Background" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/60"></div>
      </div>

      <section
        className="relative z-10 flex w-full max-w-2xl overflow-hidden rounded-2xl border border-white/20 shadow-2xl backdrop-blur-md"
        style={{
          background: "rgba(255, 255, 255, 0.1)",
        }}
      >
        {/* Removed gradient background entirely for a cleaner glassmorphism look */}

        {/* Left side: Form */}
        <div className="z-10 w-full max-w-sm bg-black/20 p-6 backdrop-blur-md">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black shadow-lg">
              <LockKeyhole size={20} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">
                LifeLine
              </p>
              <h1 className="text-xl font-bold text-white">
                {mode === "login" ? "Sign in" : "Create account"}
              </h1>
            </div>
          </div>
          <p className="mb-4 text-xs text-white/60">
            {mode === "login"
              ? "Sign in with your username and password to access the hospital console."
              : "Create a username and password to get started."}
          </p>
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-white/80" htmlFor="username">
                Username
              </Label>
              <Input
                id="username"
                autoComplete="username"
                minLength={3}
                maxLength={40}
                required
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter username"
                className="h-9 border-white/10 bg-white/5 text-sm text-white placeholder:text-white/20"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-white/80" htmlFor="password">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                minLength={8}
                maxLength={128}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                className="h-9 border-white/10 bg-white/5 text-sm text-white placeholder:text-white/20"
              />
            </div>
            {error && (
              <p
                role="alert"
                className="rounded-md border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-200"
              >
                {error}
              </p>
            )}
            <Button
              className="h-9 w-full bg-white text-sm text-black hover:bg-white/90"
              type="submit"
              disabled={loading || googleLoading}
            >
              {mode === "login" ? (
                <LogIn size={14} className="mr-2" />
              ) : (
                <UserPlus size={14} className="mr-2" />
              )}
              {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
            </Button>
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-black/20 px-2 text-white/40">Or</span>
              </div>
            </div>
            <Button
              className="h-9 w-full bg-white/10 text-sm text-white hover:bg-white/20"
              type="button"
              disabled={loading || googleLoading}
              onClick={handleGoogleSignIn}
            >
              {googleLoading ? "Signing in..." : "Sign in with Google"}
            </Button>
          </form>
          <p className="mt-4 text-center text-xs text-white/60">
            {mode === "login" ? "Don't have an account?" : "Already registered?"}{" "}
            <button
              type="button"
              className="font-semibold text-white underline-offset-4 hover:underline"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError("");
              }}
            >
              {mode === "login" ? "Create one" : "Sign in"}
            </button>
          </p>
        </div>

        {/* Right side: Decorative shape */}
        <div className="hidden flex-1 items-center justify-center p-6 md:flex bg-black/50 z-10">
          <div className="flex flex-col items-center justify-center text-center space-y-6">
            <h2 className="text-2xl font-bold text-white max-w-[250px] leading-tight">
              * <span className="text-green-400">Heroes</span> don't wear capes they{" "}
              <span className="text-red-400">donate</span> !!
            </h2>
            <img src="/login-page-logo.png" alt="Logo" className="w-40 h-auto" />
            <p className="text-sm text-white/90 font-medium">
              WELCOME BACK
              <br />
              TO THE NETWORK
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
