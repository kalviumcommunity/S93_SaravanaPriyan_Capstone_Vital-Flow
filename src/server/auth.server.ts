import jwt from "jsonwebtoken";
import { connectToMongoDB } from "@/lib/mongodb.server";
import { UserModel } from "@/models/User.server";
import { promisify } from "node:util";
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";

const scrypt = promisify(scryptCallback);
const COOKIE_NAME = "lifeline_session";
const SESSION_SECONDS = 60 * 60 * 8;

function sessionSecret() {
  const secret = process.env["AUTH_SESSION_SECRET"];
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SESSION_SECRET must be configured with at least 32 characters.");
  }
  return secret;
}

export async function registerUser(usernameValue: unknown, passwordValue: unknown) {
  const username = typeof usernameValue === "string" ? usernameValue.trim() : "";
  const password = typeof passwordValue === "string" ? passwordValue : "";
  if (!/^[a-zA-Z0-9_.-]{3,40}$/.test(username)) {
    throw new Error(
      "Username must be 3–40 characters and use letters, numbers, dot, underscore, or hyphen.",
    );
  }
  if (password.length < 8 || password.length > 128) {
    throw new Error("Password must be between 8 and 128 characters.");
  }
  await connectToMongoDB();
  const existing = await UserModel.findOne({ username }).lean();
  if (existing) throw new Error("That username is already registered.");
  const salt = randomBytes(16).toString("hex");
  const hash = (await scrypt(password, salt, 64)) as Buffer;
  const user = await UserModel.create({
    username,
    passwordSalt: salt,
    passwordHash: hash.toString("hex"),
  });
  return { id: String(user._id), username: user.username };
}

export async function verifyUser(usernameValue: unknown, passwordValue: unknown) {
  const username = typeof usernameValue === "string" ? usernameValue.trim() : "";
  const password = typeof passwordValue === "string" ? passwordValue : "";
  await connectToMongoDB();
  const user = await UserModel.findOne({ username }).exec();
  if (!user) return null;
  const candidate = (await scrypt(password, user.passwordSalt, 64)) as Buffer;
  const stored = Buffer.from(user.passwordHash, "hex");
  if (candidate.length !== stored.length || !timingSafeEqual(candidate, stored)) return null;
  return { id: String(user._id), username: user.username };
}

export function createSessionCookie(user: { id: string; username: string }) {
  const token = jwt.sign({ id: user.id, username: user.username }, sessionSecret(), {
    expiresIn: SESSION_SECONDS,
  });

  return `${COOKIE_NAME}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${SESSION_SECONDS}${process.env["NODE_ENV"] === "production" ? "; Secure" : ""}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${process.env["NODE_ENV"] === "production" ? "; Secure" : ""}`;
}

export function getSession(request: Request): { id: string; username: string } | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const entry = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`));
  if (!entry) return null;
  const token = entry.slice(COOKIE_NAME.length + 1);

  try {
    const decoded = jwt.verify(token, sessionSecret()) as { id: string; username: string };
    return { id: decoded.id, username: decoded.username };
  } catch {
    return null;
  }
}
