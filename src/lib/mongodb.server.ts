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

if (process.env.NODE_ENV !== "production") {
  globalForMongo.__lifelineMongo = cache;
}

export async function connectToMongoDB(): Promise<typeof mongoose> {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not configured");
  }

  if (cache.connection) {
    return cache.connection;
  }

  if (!cache.promise) {
    cache.promise = mongoose.connect(mongoUri).catch((error) => {
      cache.promise = null;
      console.error("MongoDB connection failed:", error);
      throw error;
    });
  }

  cache.connection = await cache.promise;
  return cache.connection;
}
