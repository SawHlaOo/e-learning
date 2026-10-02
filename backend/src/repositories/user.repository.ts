import type { Prisma } from "@prisma/client";
import { prisma } from "../config/database";

export class UserRepository {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  findActiveById(id: string) {
    return prisma.user.findFirst({
      where: { id, isActive: true },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    });
  }

  create(data: Prisma.UserCreateInput) {
    return prisma.user.create({
      data,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
  }
}

export const userRepository = new UserRepository();
