import User from "../models/user.model.js";

export const createUser = async (req, res) => {
  try {
    const newUser = req.body;
    const { email } = newUser;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(200).json({ message: "user exits" });
    }

    const userInstance = new User(newUser);
    const result = await userInstance.save();
    return res.status(201).json(result);
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({ error: "Failed to create user" });
  }
};
