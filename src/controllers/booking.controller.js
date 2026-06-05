import Booking from "../models/booking.model.js";
import mongoose from "mongoose";

// Helper to check for overlapping bookings and B2B status
const checkAvailability = async (dates, roomDetails, excludeBookingId = null) => {
  if (!dates?.checkInDate || !dates?.checkOutDate) {
    return { isOverlapping: false, isB2B: false };
  }

  const newIn = new Date(dates.checkInDate);
  const newOut = new Date(dates.checkOutDate);

  if (newIn >= newOut) {
    throw new Error("Check-out date must be after check-in date");
  }

  // Reset time to midnight for accurate day comparison
  newIn.setHours(0, 0, 0, 0);
  newOut.setHours(0, 0, 0, 0);

  const newInStr = newIn.toISOString();
  const newOutStr = newOut.toISOString();

  // Build room matching conditions
  const roomConditions = roomDetails
    ?.filter((r) => r.roomNo && r.roomNo !== "")
    ?.map((r) => ({
      roomNo: r.roomNo,
      roomType: r.roomType,
    })) || [];

  if (roomConditions.length === 0) {
    return { isOverlapping: false, isB2B: false };
  }

  // 1. Check for overlapping bookings using strict overlap logic: (newIn < exOut) && (newOut > exIn)
  const overlapQuery = {
    "dates.checkInDate": { $lt: newOutStr },
    "dates.checkOutDate": { $gt: newInStr },
    roomDetails: {
      $elemMatch: {
        $or: roomConditions,
      },
    },
  };

  if (excludeBookingId) {
    overlapQuery._id = { $ne: new mongoose.Types.ObjectId(excludeBookingId) };
  }

  const overlappingBooking = await Booking.findOne(overlapQuery);
  const isOverlapping = !!overlappingBooking;

  // 2. Check for Back to Back (B2B): check-in matches existing check-out OR check-out matches existing check-in
  const b2bQuery = {
    $or: [
      { "dates.checkOutDate": newInStr },
      { "dates.checkInDate": newOutStr },
    ],
    roomDetails: {
      $elemMatch: {
        $or: roomConditions,
      },
    },
  };

  if (excludeBookingId) {
    b2bQuery._id = { $ne: new mongoose.Types.ObjectId(excludeBookingId) };
  }

  const b2bBooking = await Booking.findOne(b2bQuery);
  const isB2B = !!b2bBooking;

  return { isOverlapping, isB2B };
};

// Create booking
export const createBooking = async (req, res) => {
  try {
    const bookingData = req.body;

    const { isOverlapping, isB2B } = await checkAvailability(
      bookingData.dates,
      bookingData.roomDetails
    );

    if (isOverlapping) {
      return res.status(400).json({
        error: "Booking overlaps with an existing booking for the selected room(s) and selected date.",
      });
    }

    if (isB2B) {
      bookingData.isB2B = true;
      bookingData.b2bText = "B2B";
    } else {
      bookingData.isB2B = false;
      bookingData.b2bText = "";
    }

    const newBooking = new Booking(bookingData);
    const result = await newBooking.save();
    return res.status(201).json(result);
  } catch (error) {
    console.error("Error creating booking:", error);
    return res.status(400).json({ error: error.message || "Failed to create booking" });
  }
};

// Update booking
export const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid booking ID" });
    }

    const { isOverlapping, isB2B } = await checkAvailability(
      updatedData.dates,
      updatedData.roomDetails,
      id
    );

    if (isOverlapping) {
      return res.status(400).json({
        error: "Updated dates overlap with an existing booking for the selected room(s).",
      });
    }

    const updatePayload = {
      dates: updatedData.dates,
      roomDetails: updatedData.roomDetails,
      packageDetails: updatedData.packageDetails,
      customerDetails: updatedData.customerDetails,
      billing: updatedData.billing,
    };

    if (isB2B) {
      updatePayload.isB2B = true;
      updatePayload.b2bText = "B2B";
    } else {
      updatePayload.isB2B = false;
      updatePayload.b2bText = "";
    }

    const result = await Booking.findByIdAndUpdate(
      id,
      { $set: updatePayload },
      { new: true, runValidators: true }
    );

    if (!result) {
      return res.status(404).json({ error: "Booking not found" });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error updating booking:", error);
    return res.status(400).json({ error: error.message || "Failed to update booking" });
  }
};

// Get bookings with search, status filter, sorting, month filtering, and pagination
export const getBookings = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10, sort, month, year, date } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const query = {};

    // Search by customer name or customer code
    if (search) {
      query.$or = [
        { "customerDetails.name": { $regex: search, $options: "i" } },
        { "customerDetails.customerCode": { $regex: search, $options: "i" } },
      ];
    }

    // Status filter
    if (status && status !== "All") {
      query["billing.paymentStatus"] = status;
    }

    // Specific date range filtering (index-friendly, overrides month filter)
    if (date) {
      const selectedDate = new Date(date);
      const startDate = new Date(selectedDate.getTime());
      startDate.setUTCHours(0, 0, 0, 0);

      const endDate = new Date(selectedDate.getTime());
      endDate.setUTCHours(23, 59, 59, 999);

      query["dates.checkInDate"] = {
        $gte: startDate.toISOString(),
        $lte: endDate.toISOString(),
      };
    } else if (month && month !== "All") {
      const startMonth = parseInt(month);
      const startYear = parseInt(year || new Date().getFullYear());

      const startDate = new Date(Date.UTC(startYear, startMonth - 1, 1, 0, 0, 0, 0));
      const endDate = new Date(Date.UTC(startYear, startMonth, 1, 0, 0, 0, 0));

      query["dates.checkInDate"] = {
        $gte: startDate.toISOString(),
        $lt: endDate.toISOString(),
      };
    }

    // Sorting criteria
    let sortCriteria = {};
    if (sort === "checkIn_asc") {
      sortCriteria = { "dates.checkInDate": 1 };
    } else if (sort === "checkIn_desc") {
      sortCriteria = { "dates.checkInDate": -1 };
    } else if (sort === "booking_asc") {
      sortCriteria = { "dates.bookingDate": 1 };
    } else if (sort === "booking_desc") {
      sortCriteria = { "dates.bookingDate": -1 };
    } else {
      sortCriteria = { "dates.checkInDate": -1 }; // default
    }

    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .sort(sortCriteria)
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      bookings,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      totalBookings: total,
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return res.status(500).json({ error: "Failed to fetch bookings" });
  }
};

// Get booking by ID
export const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid booking ID" });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    return res.status(200).json(booking);
  } catch (error) {
    console.error("Error fetching booking details:", error);
    return res.status(500).json({ error: "Failed to fetch booking details" });
  }
};
