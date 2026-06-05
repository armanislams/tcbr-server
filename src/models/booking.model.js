import mongoose from "mongoose";

const roomDetailSchema = new mongoose.Schema({
  roomType: { type: String, required: true },
  roomNo: { type: String, required: true, index: true },
  adults: { type: Number, default: 0 },
  children: { type: Number, default: 0 },
  price: { type: Number, default: 0 },
}, { _id: false });

const packageDetailSchema = new mongoose.Schema({
  packageType: { type: String },
  noPax: { type: String },
  packageQuantity: { type: String },
  price: { type: String },
}, { _id: false });

const extraChargeSchema = new mongoose.Schema({
  name: { type: String },
  amount: { type: String },
}, { _id: false });

const bookingSchema = new mongoose.Schema(
  {
    dates: {
      checkInDate: { type: String, required: true, index: true },
      checkOutDate: { type: String, required: true, index: true },
      bookingDate: { type: String, required: true },
      bookingType: { type: String },
      bookingReference: { type: String, index: true },
      purposeOfVisit: { type: String },
      remarks: { type: String },
    },
    roomDetails: [roomDetailSchema],
    packageDetails: [packageDetailSchema],
    customerDetails: {
      name: { type: String, required: true, index: true },
      customerCode: { type: String, required: true, index: true },
      mobile: { type: String },
      email: { type: String },
      gender: { type: String },
      nationality: { type: String },
    },
    billing: {
      discountReason: { type: String },
      discount: { type: String },
      commission: { type: String },
      paymentMode: { type: String },
      paymentRef: { type: String },
      paymentStatus: { type: String, default: "pending", index: true },
      totalAmountInput: { type: String },
      advanceRemarks: { type: String },
      advanceAmountInput: { type: String },
      bookingChargeInput: { type: String },
      extraCharges: [extraChargeSchema],
    },
    isB2B: { type: Boolean, default: false },
    b2bText: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);

// Compound index on check-in and check-out dates for quick range overlapping checks
bookingSchema.index({ "dates.checkInDate": 1, "dates.checkOutDate": 1 });

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;
