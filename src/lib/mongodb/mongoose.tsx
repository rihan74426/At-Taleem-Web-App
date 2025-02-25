import mongoose from "mongoose";

let initialized = false;

export const connect = async () => {
  mongoose.set("strictQuery", true);
  if (initialized) {
    console.log("Database is already connected");
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "Taleembd",
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    initialized = true;
  } catch (error) {
    console.error("Error connecting to database:", error);
  }
};
