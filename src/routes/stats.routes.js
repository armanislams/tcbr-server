import express from "express";
import { getAdminStats } from "../controllers/stats.controller.js";

const router = express.Router();

router.get("/", getAdminStats);

export default router;
