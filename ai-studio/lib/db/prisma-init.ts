// Set Prisma engine type before any Prisma module loads
process.env.PRISMA_QUERY_ENGINE_TYPE = "binary";

// Now load and re-export PrismaClient
export { PrismaClient } from "@prisma/client";
