import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "../shared/schema";

// Database connection - using SQLite for development
const sqlite = new Database("database.db");
sqlite.pragma('foreign_keys = ON');
export const db = drizzle(sqlite, { schema });
