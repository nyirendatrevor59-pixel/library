import 'dotenv/config';
import { db } from '../server/storage.js';
import { users, courses } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

async function seedCourses() {
  try {
    // Find the lecturer user
    const lecturerUser = await db.select().from(users).where(eq(users.role, "lecturer")).limit(1);
    const lecturerId = lecturerUser.length > 0 ? lecturerUser[0].id : null;

    const SAMPLE_COURSES = [
      {
        id: "1",
        name: "Introduction to Computer Science",
        code: "CS101",
        category: "Computer Science",
        description: "Fundamentals of programming and algorithms",
        lecturerName: "Dr. Sarah Johnson",
      },
      {
        id: "2",
        name: "Data Structures and Algorithms",
        code: "CS201",
        category: "Computer Science",
        description: "Advanced data structures and algorithm design",
        lecturerName: "Prof. Michael Chen",
      },
      {
        id: "3",
        name: "Calculus I",
        code: "MATH101",
        category: "Mathematics",
        description: "Differential and integral calculus",
        lecturerName: "Dr. Emily Watson",
      },
      {
        id: "4",
        name: "Linear Algebra",
        code: "MATH201",
        category: "Mathematics",
        description: "Vector spaces and linear transformations",
        lecturerName: "Prof. David Lee",
      },
      {
        id: "5",
        name: "Physics I",
        code: "PHY101",
        category: "Physics",
        description: "Classical mechanics and thermodynamics",
        lecturerName: "Dr. Robert Miller",
      },
      {
        id: "6",
        name: "Organic Chemistry",
        code: "CHEM201",
        category: "Chemistry",
        description: "Structure and reactions of organic compounds",
        lecturerName: "Dr. Lisa Anderson",
      },
      {
        id: "7",
        name: "Business Management",
        code: "BUS101",
        category: "Business",
        description: "Principles of business and management",
        lecturerName: "Prof. James Wilson",
      },
      {
        id: "8",
        name: "English Literature",
        code: "ENG201",
        category: "Literature",
        description: "Classic and modern English literature",
        lecturerName: "Dr. Amanda Brown",
      },
    ];

    for (const course of SAMPLE_COURSES) {
      const existing = await db.select().from(courses).where(eq(courses.id, course.id)).limit(1);
      if (existing.length === 0) {
        await db.insert(courses).values({
          id: course.id,
          name: course.name,
          code: course.code,
          category: course.category,
          description: course.description,
          lecturerId,
          lecturerName: course.lecturerName,
        });
      } else {
        // Update lecturerId if not set
        if (!existing[0].lecturerId && lecturerId) {
          await db.update(courses).set({ lecturerId }).where(eq(courses.id, course.id));
        }
      }
    }
    console.log("Courses seeded");
  } catch (error) {
    console.error("Error seeding courses:", error);
  }
}

seedCourses().then(() => process.exit(0));