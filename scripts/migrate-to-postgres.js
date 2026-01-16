const Database = require('better-sqlite3');
const { Client } = require('pg');
const path = require('path');
const fs = require('fs');

async function migrateToPostgres() {
  console.log('Starting migration from SQLite to PostgreSQL...');

  // SQLite connection
  const sqliteDb = new Database('./database.db');

  // PostgreSQL connection
  const pgConnectionString = process.env.DATABASE_URL || 'postgresql://akazi_study_hub_database_user:3iafjONUDa92rt3r3euNcrBBOLU3bKkF@dpg-d5kuvs6id0rc73aq36lg-a.oregon-postgres.render.com/akazi_study_hub_database';
  const pgClient = new Client({
    connectionString: pgConnectionString,
    ssl: { rejectUnauthorized: false }
  });
  await pgClient.connect();

  try {
    // Get all table names from SQLite
    const tables = sqliteDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '__drizzle_migrations'").all();

    console.log('Found tables:', tables.map(t => t.name));

    for (const table of tables) {
      const tableName = table.name;
      console.log(`\nMigrating table: ${tableName}`);

      // Get column info
      const columns = sqliteDb.prepare(`PRAGMA table_info(${tableName})`).all();
      console.log(`Columns:`, columns.map(c => c.name));

      // Get all data
      const data = sqliteDb.prepare(`SELECT * FROM ${tableName}`).all();
      console.log(`Records: ${data.length}`);

      if (data.length === 0) {
        console.log(`Skipping empty table: ${tableName}`);
        continue;
      }

      // Create table in PostgreSQL (simplified - you may need to adjust types)
      const columnDefs = columns.map(col => {
        let type = 'TEXT';
        if (col.type.toLowerCase().includes('integer')) type = 'INTEGER';
        if (col.type.toLowerCase().includes('real')) type = 'REAL';
        return `"${col.name}" ${type}${col.pk ? ' PRIMARY KEY' : ''}`;
      }).join(', ');

      try {
        await pgClient.query(`DROP TABLE IF EXISTS "${tableName}"`);
        await pgClient.query(`CREATE TABLE "${tableName}" (${columnDefs})`);
        console.log(`Created table ${tableName} in PostgreSQL`);
      } catch (error) {
        console.error(`Error creating table ${tableName}:`, error);
        continue;
      }

      // Insert data in batches
      const batchSize = 100;
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        try {
          const values = batch.map(row => {
            const rowValues = columns.map(col => row[col.name]);
            return rowValues;
          });

          if (values.length > 0) {
            const placeholders = values[0].map((_, idx) => `$${idx + 1}`).join(', ');
            const query = `INSERT INTO "${tableName}" VALUES (${placeholders})`;

            for (const rowValues of values) {
              await pgClient.query(query, rowValues);
            }
          }

          console.log(`Inserted ${Math.min(batchSize, data.length - i)} records into ${tableName}`);
        } catch (error) {
          console.error(`Error inserting batch into ${tableName}:`, error);
        }
      }
    }

    console.log('\nMigration completed successfully!');

    // Optional: Backup and remove SQLite database
    const backupPath = './database.db.backup';
    fs.copyFileSync('./database.db', backupPath);
    console.log(`SQLite database backed up to ${backupPath}`);

    // Uncomment to remove old database after verification
    // fs.unlinkSync('./database.db');
    // console.log('Old SQLite database removed');

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    sqliteDb.close();
    await pgClient.end();
  }
}

migrateToPostgres().catch(console.error);