import { PrismaClient } from "../generated/prisma";

/** One global Prisma instance for the whole server. */
export const prisma = new PrismaClient();
