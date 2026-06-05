import express from "express";
import cors from "cors";
import "dotenv/config";
import { connectDB } from "./src/config/db.js";
import centralRouter from "./src/routes/index.js";

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Root test route
app.get("/", (req, res) => {
  res.send("tcbr server running good");
});

// Centralized MVC API Routes
app.use("/", centralRouter);

// Start server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(port, () => {
      console.log(`Server is running on port: ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();