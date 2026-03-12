import mongoose from "mongoose";

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

  await mongoose.connect(dbUrl, {
    serverSelectionTimeoutMS: 10000,
  });
};

export default connectDB;
