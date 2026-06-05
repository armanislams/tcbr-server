import Menu from "../models/menu.model.js";

export const createMenu = async (req, res) => {
  try {
    const newMenu = new Menu(req.body);
    const result = await newMenu.save();
    return res.status(201).json(result);
  } catch (error) {
    console.error("Error creating menu:", error);
    return res.status(500).json({ error: "Failed to create menu" });
  }
};

export const getMenus = async (req, res) => {
  try {
    const menus = await Menu.find();
    return res.status(200).json(menus);
  } catch (error) {
    console.error("Error fetching menus:", error);
    return res.status(500).json({ error: "Failed to fetch menus" });
  }
};
