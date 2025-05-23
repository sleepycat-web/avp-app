import { MongoClient, Db } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGODB_URI;
const options = {};

if (!process.env.MONGODB_URI) {
  throw new Error("Please add your Mongo URI to .env.local");
}

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri as string, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  const client = new MongoClient(uri as string, options);
  clientPromise = client.connect();
}

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase() {
  if (!cachedClient || !cachedDb) {
    const uri = process.env.MONGODB_URI!;
    const client = new MongoClient(uri);
    await client.connect(); // ← ensure the client is connected
    const db = client.db(process.env.MONGODB_DB);
    cachedClient = client;
    cachedDb = db;
  }
  return { client: cachedClient, db: cachedDb! };
}
