import mongoose from "mongoose";

const menuSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    path: {
      type: String,
      required: true,
      trim: true,
    },
    isSubMenu: {
      type: Boolean,
      default: false,
    },
    icon: {
      type: String,
      trim: true,
    },
    subMenu: {
      type: Array,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Menu = mongoose.model("Menu", menuSchema);
export default Menu;
