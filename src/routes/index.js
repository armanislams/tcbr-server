import express from "express";
import bookingRouter from "./booking.routes.js";
import userRouter from "./user.routes.js";
import menuRouter from "./menu.routes.js";
import statsRouter from "./stats.routes.js";

const centralRouter = express.Router();

centralRouter.use("/bookings", bookingRouter);
centralRouter.use("/users", userRouter);
centralRouter.use("/menus", menuRouter);
centralRouter.use("/admin-stats", statsRouter);

export default centralRouter;
