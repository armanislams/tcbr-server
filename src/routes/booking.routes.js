import express from "express";
import { body, validationResult } from "express-validator";
import {
  createBooking,
  updateBooking,
  getBookings,
  getBookingById,
} from "../controllers/booking.controller.js";

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg, errors: errors.array() });
  }
  next();
};

const bookingValidationRules = [
  body("dates.checkInDate").notEmpty().withMessage("Check-in date is required"),
  body("dates.checkOutDate").notEmpty().withMessage("Check-out date is required"),
  body("customerDetails.name").notEmpty().withMessage("Customer name is required"),
  body("customerDetails.customerCode").notEmpty().withMessage("Customer code is required"),
  body("roomDetails").isArray({ min: 1 }).withMessage("At least one room is required"),
  body("roomDetails.*.roomType").notEmpty().withMessage("Room type is required for all rooms"),
  body("roomDetails.*.roomNo").notEmpty().withMessage("Room number is required for all rooms"),
  validate,
];

router.get("/", getBookings);
router.get("/:id", getBookingById);
router.post("/", bookingValidationRules, createBooking);
router.patch("/:id", bookingValidationRules, updateBooking);

export default router;
