import { defineConfig } from "prisma/config";

// Placeholder URL for CLI tooling when DATABASE_URL is not configured yet.
// Prisma is not connected at runtime — see prisma/schema.prisma.
const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/splitlify";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});
