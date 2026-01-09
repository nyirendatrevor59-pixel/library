const Database = require('better-sqlite3');
const db = new Database('database.db');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student',
    name TEXT NOT NULL,
    selectedCourses TEXT DEFAULT '[]',
    createdAt INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    description TEXT,
    lecturerId TEXT,
    lecturerName TEXT,
    createdAt INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (lecturerId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS live_sessions (
    id TEXT PRIMARY KEY,
    courseId TEXT,
    lecturerId TEXT,
    topic TEXT NOT NULL,
    scheduledTime INTEGER,
    startTime INTEGER,
    endTime INTEGER,
    isLive INTEGER DEFAULT 0,
    participants INTEGER DEFAULT 0,
    settings TEXT,
    createdAt INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (courseId) REFERENCES courses(id),
    FOREIGN KEY (lecturerId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    sessionId TEXT,
    userId TEXT,
    message TEXT NOT NULL,
    timestamp INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (sessionId) REFERENCES live_sessions(id),
    FOREIGN KEY (userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS shared_documents (
    id TEXT PRIMARY KEY,
    sessionId TEXT,
    userId TEXT,
    title TEXT NOT NULL,
    fileUrl TEXT NOT NULL,
    fileType TEXT NOT NULL,
    annotations TEXT,
    sharedAt INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (sessionId) REFERENCES live_sessions(id),
    FOREIGN KEY (userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS lecturer_materials (
    id TEXT PRIMARY KEY,
    lecturerId TEXT,
    courseId TEXT,
    title TEXT NOT NULL,
    description TEXT,
    fileUrl TEXT,
    fileType TEXT,
    content TEXT,
    createdAt INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (courseId) REFERENCES courses(id)
  );

  CREATE TABLE IF NOT EXISTS tutor_requests (
    id TEXT PRIMARY KEY,
    studentId TEXT,
    courseId TEXT,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    messages TEXT,
    response TEXT,
    status TEXT DEFAULT 'pending',
    createdAt INTEGER DEFAULT (strftime('%s', 'now')),
    updatedAt INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (studentId) REFERENCES users(id),
    FOREIGN KEY (courseId) REFERENCES courses(id)
  );

  CREATE TABLE IF NOT EXISTS support_requests (
    id TEXT PRIMARY KEY,
    userId TEXT,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'open',
    assignedTo TEXT,
    createdAt INTEGER DEFAULT (strftime('%s', 'now')),
    updatedAt INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (userId) REFERENCES users(id),
    FOREIGN KEY (assignedTo) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS user_analytics (
    id TEXT PRIMARY KEY,
    userId TEXT,
    metric TEXT NOT NULL,
    value INTEGER NOT NULL,
    date INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS user_tutors (
    id TEXT PRIMARY KEY,
    studentId TEXT,
    tutorId TEXT,
    courseId TEXT,
    assignedBy TEXT,
    assignedAt INTEGER DEFAULT (strftime('%s', 'now')),
    status TEXT DEFAULT 'active',
    FOREIGN KEY (studentId) REFERENCES users(id),
    FOREIGN KEY (tutorId) REFERENCES users(id),
    FOREIGN KEY (courseId) REFERENCES courses(id),
    FOREIGN KEY (assignedBy) REFERENCES users(id)
  );
`);

console.log('Database initialized successfully!');
db.close();