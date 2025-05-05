// src/lib/mongodb/index.ts
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

// This approach uses a module-level variable to cache the connection
// instead of using the global object
let cached: {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
} = { conn: null, promise: null };

async function dbConnect() {
  // If we have a connection already, return it
  if (cached.conn) {
    return cached.conn;
  }

  // If a connection is being established, wait for it
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts)
      .then((mongoose) => {
        return mongoose;
      });
  }
  
  // Wait for the connection to be established
  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;