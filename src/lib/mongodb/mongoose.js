import mongoose from "mongoose";

let initialized = false;

export const connect = async () => {
  mongoose.set("strictQuery", true);
  if (initialized) {
    console.log("Database is already connected");
  }

  const MONGO_URI = process.env.MONGODB_URI;
  if (!MONGO_URI) {
    throw new Error("MONGODB_URI is not set in environment variables");
  }
  try {
    await mongoose.connect(MONGO_URI, {
      dbName: "Taleembd",
    });
    initialized = true;
  } catch (error) {
    console.error("Error connecting to database:", error);
  }
};
