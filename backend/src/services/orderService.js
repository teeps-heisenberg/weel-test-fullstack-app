import prisma from "../config/prisma.js";

const userSelect = {
  id: true,
  email: true,
  createdAt: true,
};

const orderInclude = {
  user: {
    select: userSelect,
  },
};

const orderService = {
  async create(userId, orderData) {
    return prisma.order.create({
      data: {
        userId,
        ...orderData,
      },
      include: orderInclude,
    });
  },

  async findById(orderId) {
    return prisma.order.findUnique({
      where: { id: orderId },
      include: orderInclude,
    });
  },

  async update(orderId, updateData) {
    try {
      return await prisma.order.update({
        where: { id: orderId },
        data: updateData,
        include: orderInclude,
      });
    } catch (error) {
      if (error?.code === "P2025") {
        return null;
      }

      throw error;
    }
  },
};

export default orderService;

