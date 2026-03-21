import mongoose from "mongoose";

const LOCAL_MONGO_REGEX = /^mongodb:\/\/(localhost|127\.0\.0\.1)(?::\d+)?\//i;
const connectDB = async () => {
  const dbUrl = process.env.DB_URL;
  if (!dbUrl) {
    throw new Error("DB_URL is missing in the environment configuration.");
  }
  mongoose.connection.on("connected", () => {
    console.log("Database connected");
  });
  mongoose.connection.on("error", (error) => {
    console.error("MongoDB connection error:", error.message);
  });
  try {
    await mongoose.connect(dbUrl, {
      serverSelectionTimeoutMS: 10000,
    });
  } catch (error) {
    const baseMessage = error?.message || "Unknown MongoDB connection error";
    if (LOCAL_MONGO_REGEX.test(dbUrl) && /ECONNREFUSED/i.test(baseMessage)) {
      throw new Error(
        `Cannot connect to local MongoDB at ${dbUrl}. Start the MongoDB service on this machine or change DB_URL to your shared database server. Original error: ${baseMessage}`,
      );
    }
    throw new Error(`Failed to connect to MongoDB (${dbUrl}): ${baseMessage}`);
  }
};
export default connectDB;