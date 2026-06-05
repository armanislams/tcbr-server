import mongoose from "mongoose";

export const connectDB = async () => {
  const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xbf1ip3.mongodb.net/tcbr?appName=Cluster0`;
  try {
    await mongoose.connect(uri, {
      dbName: "tcbr",
    });
    console.log("MongoDB connected successfully via Mongoose");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};
