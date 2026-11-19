import mongoose from "mongoose";

type MongoCache = {
  connection: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongo = globalThis as typeof globalThis & {
  __lifelineMongo?: MongoCache;
};

const cache: MongoCache = globalForMongo.__lifelineMongo ?? {
  connection: null,
  promise: null,
};

if (process.env["NODE_ENV"] !== "production") {
  globalForMongo.__lifelineMongo = cache;
}

export async function connectToMongoDB(): Promise<typeof mongoose> {
  const mongoUri = process.env["MONGODB_URI"]?.trim();
  const databaseName = process.env["MONGODB_DATABASE"]?.trim() || "lifeline_hospital";

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not configured. Add it to your .env file.");
  }

  if (!mongoUri.startsWith("mongodb://") && !mongoUri.startsWith("mongodb+srv://")) {
    throw new Error("MONGODB_URI must start with mongodb:// or mongodb+srv://.");
  }

  if (cache.connection?.connection.readyState === 1) {
    return cache.connection;
  }

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(mongoUri, {
        dbName: databaseName,
        serverSelectionTimeoutMS: 10000,
      })
      .then((connection) => {
        console.info(
          `MongoDB connected: ${connection.connection.host}/${connection.connection.name}`,
        );
        return connection;
      })
      .catch((error: unknown) => {
        cache.promise = null;
        cache.connection = null;
        console.error("MongoDB connection failed:", error);
        throw error;
      });
  }

  cache.connection = await cache.promise;
  return cache.connection;
}
