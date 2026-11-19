import "dotenv/config";
import mongoose from "mongoose";

const uri = process.env.MONGODB_URI?.trim();
const dbName = process.env.MONGODB_DATABASE?.trim() || "lifeline_hospital";

if (!uri) {
  console.error("FAILED: MONGODB_URI is missing. Create a .env file from .env.example.");
  process.exit(1);
}

try {
  await mongoose.connect(uri, {
    dbName,
    serverSelectionTimeoutMS: 10000,
  });

  console.log("SUCCESS: Connected to MongoDB Atlas.");
  console.log(`Database: ${mongoose.connection.name}`);
  console.log(`Cluster host: ${mongoose.connection.host}`);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("FAILED: Could not connect to MongoDB.");
  console.error(message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect().catch(() => undefined);
}
