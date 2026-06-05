import Booking from "../models/booking.model.js";

export const getAdminStats = async (req, res) => {
  try {
    const bookings = await Booking.find();

    // 1. Total Revenue
    const totalRevenue = bookings.reduce((sum, b) => {
      const total = Number(b.billing?.totalAmountInput) || 0;
      return sum + total;
    }, 0);

    // 2. Today's Bookings (based on bookingDate in ISO format, checking if it includes today's date)
    const todayStr = new Date().toISOString().split('T')[0];
    const todayBookings = bookings.filter((b) => {
      const bDate = b.dates?.bookingDate;
      return bDate && bDate.includes(todayStr);
    }).length;

    // 3. Pending Bookings (anything that is not 'Success' and not 'Confirmed')
    const pendingBookings = bookings.filter((b) => {
      const status = b.billing?.paymentStatus || b.paymentStatus;
      return status !== "Success" && status !== "Confirmed";
    }).length;

    // 4. Total Bookings
    const totalBookings = bookings.length;

    return res.status(200).json({
      totalRevenue,
      todayBookings,
      pendingBookings,
      totalBookings,
    });
  } catch (error) {
    console.error("Error calculating stats:", error);
    return res.status(500).json({ error: "Failed to calculate statistics" });
  }
};
