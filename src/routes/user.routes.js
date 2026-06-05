import express from "express";
import { body, validationResult } from "express-validator";
import { createUser } from "../controllers/user.controller.js";

const router = express.Router();

// Middleware to handle validation errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.post(
  "/",
  [
    body("email").isEmail().withMessage("Please provide a valid email address"),
    body("name").notEmpty().withMessage("Name is required"),
    validate,
  ],
  createUser
);

export default router;
