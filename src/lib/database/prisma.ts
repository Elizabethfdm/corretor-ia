import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env["DATABASE_URL"];

  if (!connectionString) {
    throw new Error("DATABASE_URL não está definida.");
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma = globalThis.prismaGlobal ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}
