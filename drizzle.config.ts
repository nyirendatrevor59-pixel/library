import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://akazi_study_hub_database_user:3iafjONUDa92rt3r3euNcrBBOLU3bKkF@dpg-d5kuvs6id0rc73aq36lg-a.oregon-postgres.render.com/akazi_study_hub_database",
  },
});
