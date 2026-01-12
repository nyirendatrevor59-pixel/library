const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.db');
const db = new Database(dbPath);

console.log('Adding missing columns to database...');

// Add settings to live_sessions if not exists
try {
  db.exec(`ALTER TABLE live_sessions ADD COLUMN settings text;`);
  console.log('Added settings column to live_sessions');
} catch (e) {
  if (e.message.includes('duplicate column name')) {
    console.log('settings column already exists in live_sessions');
  } else {
    console.error('Error adding settings to live_sessions:', e.message);
  }
}

// Add retryCount, nextRetryAt, maxRetries, updatedAt to payments if not exists
try {
  db.exec(`ALTER TABLE payments ADD COLUMN retryCount integer DEFAULT 0;`);
  console.log('Added retryCount column to payments');
} catch (e) {
  if (e.message.includes('duplicate column name')) {
    console.log('retryCount column already exists in payments');
  } else {
    console.error('Error adding retryCount to payments:', e.message);
  }
}

try {
  db.exec(`ALTER TABLE payments ADD COLUMN nextRetryAt integer;`);
  console.log('Added nextRetryAt column to payments');
} catch (e) {
  if (e.message.includes('duplicate column name')) {
    console.log('nextRetryAt column already exists in payments');
  } else {
    console.error('Error adding nextRetryAt to payments:', e.message);
  }
}

try {
  db.exec(`ALTER TABLE payments ADD COLUMN maxRetries integer DEFAULT 5;`);
  console.log('Added maxRetries column to payments');
} catch (e) {
  if (e.message.includes('duplicate column name')) {
    console.log('maxRetries column already exists in payments');
  } else {
    console.error('Error adding maxRetries to payments:', e.message);
  }
}

try {
  db.exec(`ALTER TABLE payments ADD COLUMN updatedAt integer DEFAULT (strftime('%s', 'now'));`);
  console.log('Added updatedAt column to payments');
} catch (e) {
  if (e.message.includes('duplicate column name')) {
    console.log('updatedAt column already exists in payments');
  } else {
    console.error('Error adding updatedAt to payments:', e.message);
  }
}

// Add notifications table if not exists
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id text PRIMARY KEY NOT NULL,
      userId text,
      type text NOT NULL,
      title text NOT NULL,
      message text NOT NULL,
      data text,
      isRead integer DEFAULT 0,
      createdAt integer DEFAULT (strftime('%s', 'now'))
    );
  `);
  console.log('Created notifications table');
} catch (e) {
  console.error('Error creating notifications table:', e.message);
}

// Add annotations and sharedAt to shared_documents if not exists
try {
  db.exec(`ALTER TABLE shared_documents ADD COLUMN annotations text;`);
  console.log('Added annotations column to shared_documents');
} catch (e) {
  if (e.message.includes('duplicate column name')) {
    console.log('annotations column already exists in shared_documents');
  } else {
    console.error('Error adding annotations to shared_documents:', e.message);
  }
}

try {
  db.exec(`ALTER TABLE shared_documents ADD COLUMN sharedAt integer;`);
  console.log('Added sharedAt column to shared_documents');
} catch (e) {
  if (e.message.includes('duplicate column name')) {
    console.log('sharedAt column already exists in shared_documents');
  } else {
    console.error('Error adding sharedAt to shared_documents:', e.message);
  }
}

db.close();
console.log('Database update complete.');