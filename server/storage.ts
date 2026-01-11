import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "../shared/schema";

// Database connection - using SQLite for development
const client = new Database("./database.db");
export const db = drizzle(client, { schema });
