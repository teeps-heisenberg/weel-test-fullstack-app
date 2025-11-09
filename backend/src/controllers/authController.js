import jwt from "jsonwebtoken";

import prisma from "../config/prisma.js";
import userService from "../services/userService.js";

export const login = async (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = await userService.findByEmail(email);

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const hashedPasswordRecord = await prisma.user.findUnique({
      where: { email },
      select: { passwordHash: true },
    });

    if (
      !hashedPasswordRecord ||
      !(await userService.verifyPassword(password, hashedPasswordRecord.passwordHash))
    ) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return res.status(500).json({ error: "Server configuration error" });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      secret,
      { expiresIn: "24h" },
    );

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to process login" });
  }
};

export const getMe = async (req, res) => {
  const { userId } = req.user ?? {};

  if (!userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const user = await userService.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to retrieve user" });
  }
};

