const Database = require('better-sqlite3');
const db = new Database('database.db');

console.log('Seeding test materials...');

try {
  // Check if lecturer_materials table exists
  const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='lecturer_materials'").get();

  if (!tableExists) {
    console.log('Creating lecturer_materials table...');
    // Create table if it doesn't exist (simplified schema)
    db.exec(`
      CREATE TABLE IF NOT EXISTS lecturer_materials (
        id TEXT PRIMARY KEY,
        lecturerId TEXT,
        courseId TEXT,
        title TEXT,
        description TEXT,
        fileUrl TEXT,
        fileType TEXT,
        content TEXT,
        size INTEGER,
        createdAt INTEGER,
        isDeleted INTEGER DEFAULT 0
      )
    `);
  }

  // Find lecturer user
  const lecturer = db.prepare('SELECT id FROM users WHERE role = ?').get('lecturer');
  if (!lecturer) {
    console.log('No lecturer found, cannot seed materials');
    return;
  }

  // Seed some materials
  const materials = [
    {
      id: 'mat-1',
      lecturerId: lecturer.id,
      courseId: '1',
      title: 'Introduction to Programming',
      description: 'Basic concepts of programming',
      fileUrl: null,
      fileType: 'text/plain',
      content: Buffer.from('Sample programming content').toString('base64'),
      size: 100,
      createdAt: Math.floor(Date.now() / 1000),
      isDeleted: 0
    },
    {
      id: 'mat-2',
      lecturerId: lecturer.id,
      courseId: '1',
      title: 'Data Structures Notes',
      description: 'Notes on arrays and linked lists',
      fileUrl: null,
      fileType: 'text/plain',
      content: Buffer.from('Sample data structures content').toString('base64'),
      size: 150,
      createdAt: Math.floor(Date.now() / 1000),
      isDeleted: 0
    }
  ];

  const insert = db.prepare(`
    INSERT OR REPLACE INTO lecturer_materials
    (id, lecturerId, courseId, title, description, fileUrl, fileType, content, size, createdAt, isDeleted)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const material of materials) {
    insert.run(
      material.id,
      material.lecturerId,
      material.courseId,
      material.title,
      material.description,
      material.fileUrl,
      material.fileType,
      material.content,
      material.size,
      material.createdAt,
      material.isDeleted
    );
  }

  console.log('Test materials seeded successfully!');
} catch (error) {
  console.error('Error seeding materials:', error);
} finally {
  db.close();
}