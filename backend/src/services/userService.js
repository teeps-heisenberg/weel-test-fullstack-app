import bcrypt from "bcryptjs";

import prisma from "../config/prisma.js";

const userService = {
  async findByEmail(email) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    const { passwordHash, ...safeUser } = user;

    return safeUser;
  },

  async findById(id) {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return null;
    }

    const { passwordHash, ...safeUser } = user;

    return safeUser;
  },

  async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  },
};

export default userService;

