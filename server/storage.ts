import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres-js";
import * as schema from "../shared/schema";

const connectionString = process.env.DATABASE_URL || 'postgresql://akazi_study_hub_database_user:3iafjONUDa92rt3r3euNcrBBOLU3bKkF@dpg-d5kuvs6id0rc73aq36lg-a.oregon-postgres.render.com/akazi_study_hub_database';
const client = postgres(connectionString);
export const db = drizzle(client, { schema });
