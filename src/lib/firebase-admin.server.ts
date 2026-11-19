import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { readFileSync } from "fs";
import { join } from "path";

// Avoid re-initializing in hot-reload
if (!getApps().length) {
  try {
    const serviceAccount = JSON.parse(
      readFileSync(join(process.cwd(), "service-account.json"), "utf-8"),
    );

    initializeApp({
      credential: cert(serviceAccount),
    });
  } catch (err) {
    console.error("Firebase Admin Init Error:", err);
  }
}

export const auth = getAuth();
