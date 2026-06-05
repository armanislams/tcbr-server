import express from "express";
import { body, validationResult } from "express-validator";
import { createMenu, getMenus } from "../controllers/menu.controller.js";

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.get("/", getMenus);

router.post(
  "/",
  [
    body("title").notEmpty().withMessage("Title is required"),
    body("path").notEmpty().withMessage("Path is required"),
    validate,
  ],
  createMenu
);

export default router;
