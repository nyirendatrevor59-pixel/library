import express, { type Express } from "express";
import { createServer, type Server } from "node:http";
import { db } from "./storage";
import { users, courses, liveSessions, chatMessages, sharedDocuments, lecturerMaterials, deletedMaterials, tutorRequests, supportRequests, userAnalytics, userTutors, subscriptionPlans, userSubscriptions, payments, paymentMethods, notifications } from "../shared/schema";
import { eq, and, inArray, or, ne, isNotNull, SQL, sql, gte, lte } from "drizzle-orm";
// import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "multer";
import { randomUUID } from "crypto";
import Stripe from 'stripe';

declare global {
  namespace Express {
    interface Request {
      user?: { userId: string };
      userDetails?: any;
    }
  }
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Simple in-memory cache for materials
const materialsCache = new Map<string, { data: any[], timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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

async function seedCourses() {
  try {
    // Find the lecturer user
    const lecturerUser = await db.select().from(users).where(eq(users.role, "lecturer")).limit(1);
    const lecturerId = lecturerUser.length > 0 ? lecturerUser[0].id : null;

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

async function seedUsers() {
  try {
    const testUsers = [
      {
        id: "student-1",
        username: "student",
        email: "student@test.com",
        password: "password",
        name: "Test Student",
        role: "student",
        selectedCourses: '["1"]',
      },
      {
        id: "lecturer-1",
        username: "lecturer",
        email: "lecturer@test.com",
        password: "password",
        name: "Test Lecturer",
        role: "lecturer",
      },
      {
        id: "tutor-1",
        username: "tutor",
        email: "tutor@test.com",
        password: "password",
        name: "Test Tutor",
        role: "tutor",
      },
      {
        id: "admin-1",
        username: "admin",
        email: "admin@test.com",
        password: "password",
        name: "Test Admin",
        role: "admin",
      },
    ];

    for (const user of testUsers) {
      const existing = await db.select().from(users).where(eq(users.email, user.email)).limit(1);
      if (existing.length === 0) {
        await db.insert(users).values({
          id: user.id,
          username: user.username,
          email: user.email,
          password: user.password,
          name: user.name,
          role: user.role,
          selectedCourses: "[]",
        });
      }
    }
    console.log("Users seeded");
  } catch (error) {
    console.error("Error seeding users:", error);
  }
}

async function seedMaterials() {
  try {
    // Find the actual lecturer user
    const lecturerUser = await db.select().from(users).where(eq(users.role, "lecturer")).limit(1);
    const lecturerId = lecturerUser.length > 0 ? lecturerUser[0].id : null;

    if (!lecturerId) {
      console.log("No lecturer user found, skipping material seeding");
      return;
    }

    const testMaterials = [
      {
        lecturerId,
        courseId: "1",
        title: "Introduction to Programming",
        description: "Basic concepts of programming",
        fileUrl: null,
        fileType: "text/plain",
        content: Buffer.from("Sample PDF content").toString('base64'), // Dummy content
      },
      {
        lecturerId,
        courseId: "1",
        title: "Data Structures Notes",
        description: "Notes on arrays and linked lists",
        fileUrl: null,
        fileType: "text/plain",
        content: Buffer.from("Sample PDF content 2").toString('base64'),
      },
    ];

    for (const material of testMaterials) {
      const existing = await db.select().from(lecturerMaterials).where(eq(lecturerMaterials.title, material.title)).limit(1);
      if (existing.length === 0) {
        const newMaterial = await db.insert(lecturerMaterials).values({
          id: randomUUID(),
          ...material,
        }).returning();

        // Set fileUrl after insertion
        const fileUrl = `/api/files/${newMaterial[0].id}`;
        await db.update(lecturerMaterials).set({ fileUrl }).where(eq(lecturerMaterials.id, newMaterial[0].id));
      }
    }
    console.log("Materials seeded");
  } catch (error) {
    console.error("Error seeding materials:", error);
  }
}

async function seedTutorAssignments() {
  try {
    // Find the student and tutor users
    const studentUser = await db.select().from(users).where(eq(users.role, "student")).limit(1);
    const tutorUser = await db.select().from(users).where(eq(users.role, "tutor")).limit(1);
    const adminUser = await db.select().from(users).where(eq(users.role, "admin")).limit(1);

    if (!studentUser.length || !tutorUser.length || !adminUser.length) {
      console.log("Required users not found, skipping tutor assignment seeding");
      return;
    }

    const studentId = studentUser[0].id;
    const tutorId = tutorUser[0].id;
    const assignedBy = adminUser[0].id;

    const existing = await db.select().from(userTutors).where(and(eq(userTutors.studentId, studentId), eq(userTutors.tutorId, tutorId))).limit(1);
    if (existing.length === 0) {
      await db.insert(userTutors).values({
        id: randomUUID(),
        studentId,
        tutorId,
        courseId: '1', // Assuming course 1
        assignedBy,
      });
    }
    console.log("Tutor assignments seeded");
  } catch (error) {
    console.error("Error seeding tutor assignments:", error);
  }
}

async function seedTutorRequests() {
  try {
    const studentUser = await db.select().from(users).where(eq(users.role, "student")).limit(1);
    if (!studentUser.length) {
      console.log("No student user found, skipping tutor request seeding");
      return;
    }

    const studentId = studentUser[0].id;

    // Always add a sample request, even if exists
    await db.insert(tutorRequests).values({
      id: randomUUID(),
      studentId,
      courseId: '1',
      type: 'question',
      title: 'Sample Question',
      description: 'This is a sample tutor request for testing.',
    });
    console.log("Tutor request seeded");
  } catch (error) {
    console.error("Error seeding tutor requests:", error);
  }
}

async function seedLiveSessions() {
  try {
    // Find the actual lecturer user
    const lecturerUser = await db.select().from(users).where(eq(users.role, "lecturer")).limit(1);
    const lecturerId = lecturerUser.length > 0 ? lecturerUser[0].id : null;

    if (!lecturerId) {
      console.log("No lecturer user found, skipping live session seeding");
      return;
    }

    const testSession = {
      id: 'test-live',
      courseId: '1',
      lecturerId,
      topic: 'Test Live Class',
      scheduledTime: null,
      startTime: Math.floor(Date.now() / 1000),
      isLive: 1,
      participants: 5,
    };

    const existing = await db.select().from(liveSessions).where(eq(liveSessions.id, testSession.id)).limit(1);
    if (existing.length === 0) {
      await db.insert(liveSessions).values(testSession);
    }
    console.log("Live sessions seeded");
  } catch (error) {
    console.error("Error seeding live sessions:", error);
  }
}

async function seedSubscriptionPlans() {
  try {
    const plans = [
      {
        id: "basic-plan",
        name: "Basic Plan",
        description: "Access to basic features",
        price: 999, // $9.99 in cents
        currency: "USD",
        duration: 30, // 30 days
        features: JSON.stringify(["unlimited_chat", "tutor_support", "materials_access"]),
        isActive: 1,
      },
      {
        id: "premium-plan",
        name: "Premium Plan",
        description: "Full access to all features",
        price: 1999, // $19.99 in cents
        currency: "USD",
        duration: 30, // 30 days
        features: JSON.stringify(["unlimited_chat", "tutor_support", "materials_access", "live_sessions", "priority_support"]),
        isActive: 1,
      },
      {
        id: "yearly-plan",
        name: "Yearly Plan",
        description: "Premium features for a year",
        price: 19999, // $199.99 in cents
        currency: "USD",
        duration: 365, // 365 days
        features: JSON.stringify(["unlimited_chat", "tutor_support", "materials_access", "live_sessions", "priority_support", "advanced_analytics"]),
        isActive: 1,
      },
    ];

    for (const plan of plans) {
      const existing = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, plan.id)).limit(1);
      if (existing.length === 0) {
        await db.insert(subscriptionPlans).values(plan);
      }
    }

    // Create a sample subscription for the student user
    const studentUser = await db.select().from(users).where(eq(users.role, "student")).limit(1);
    if (studentUser.length > 0) {
      const studentId = studentUser[0].id;
      const existingSub = await db.select().from(userSubscriptions).where(eq(userSubscriptions.userId, studentId)).limit(1);

      if (existingSub.length === 0) {
        const now = Math.floor(Date.now() / 1000);
        const endDate = now + (30 * 24 * 60 * 60); // 30 days from now

        await db.insert(userSubscriptions).values({
          id: randomUUID(),
          userId: studentId,
          planId: "premium-plan",
          status: "active",
          startDate: now,
          endDate: endDate,
          autoRenew: 1,
        });
        console.log("Sample subscription created for student");
      }
    }

    console.log("Subscription plans seeded");
  } catch (error) {
    console.error("Error seeding subscription plans:", error);
  }
}

async function seedAnalytics() {
  try {
    // Get all users
    const allUsers = await db.select().from(users);

    // Seed some sample analytics data
    const analyticsData = [
      { userId: allUsers.find(u => u.role === 'student')?.id, metric: 'sessions_attended', value: 3 },
      { userId: allUsers.find(u => u.role === 'student')?.id, metric: 'documents_viewed', value: 5 },
      { userId: allUsers.find(u => u.role === 'student')?.id, metric: 'messages_sent', value: 2 },
      { userId: allUsers.find(u => u.role === 'lecturer')?.id, metric: 'materials_uploaded', value: 2 },
    ];

    for (const data of analyticsData) {
      if (data.userId) {
        const existing = await db.select().from(userAnalytics).where(and(
          eq(userAnalytics.userId, data.userId),
          eq(userAnalytics.metric, data.metric)
        )).limit(1);
        if (existing.length === 0) {
          await db.insert(userAnalytics).values({
            id: randomUUID(),
            userId: data.userId,
            metric: data.metric,
            value: data.value,
            date: Math.floor(Date.now() / 1000),
          });
        }
      }
    }
    console.log("Analytics seeded");
  } catch (error) {
    console.error("Error seeding analytics:", error);
  }
}



const fs = require('fs');
const path = require('path');

const materialsFile = path.join(__dirname, 'uploadedMaterials.json');

// Multer configuration for file uploads
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

let uploadedMaterials: any[] = [];

function loadMaterials() {
  try {
    if (fs.existsSync(materialsFile)) {
      const data = fs.readFileSync(materialsFile, 'utf8');
      uploadedMaterials = JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading materials:', error);
    uploadedMaterials = [];
  }
}

function saveMaterials() {
  try {
    fs.writeFileSync(materialsFile, JSON.stringify(uploadedMaterials, null, 2));
  } catch (error) {
    console.error('Error saving materials:', error);
  }
}

loadMaterials();

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Notification utility
async function createNotification(userId: string, type: string, title: string, message: string, data?: any) {
  try {
    await db.insert(notifications).values({
      id: randomUUID(),
      userId,
      type,
      title,
      message,
      data: data ? JSON.stringify(data) : null,
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}



// Authentication middleware
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Role-based authorization middleware
function requireRole(role: string | string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    console.log('requireRole: checking userId', req.user.userId, 'for roles', role);

    // Get user details from database
    db.select().from(users).where(eq(users.id, req.user.userId)).limit(1)
      .then(userResult => {
        if (userResult.length === 0) {
          return res.status(404).json({ error: 'User not found' });
        }

        const user = userResult[0];
        const roles = Array.isArray(role) ? role : [role];
        if (!roles.includes(user.role)) {
          return res.status(403).json({ error: `Access denied. One of ${roles.join(', ')} roles required.` });
        }

        req.userDetails = user;
        next();
      })
      .catch(error => {
        console.error('Error checking user role:', error);
        res.status(500).json({ error: 'Internal server error' });
      });
  };
}

// Subscription status check middleware
function requireSubscription(feature?: string) {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userId = req.user.userId;

    // Check user's active subscription
    db.select({
      id: userSubscriptions.id,
      status: userSubscriptions.status,
      endDate: userSubscriptions.endDate,
      plan: {
        features: subscriptionPlans.features,
      }
    })
    .from(userSubscriptions)
    .leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
    .where(and(
      eq(userSubscriptions.userId, userId),
      eq(userSubscriptions.status, 'active')
    ))
    .orderBy(userSubscriptions.createdAt)
    .limit(1)
    .then(subscriptionResult => {
      const now = Math.floor(Date.now() / 1000);
      let hasAccess = false;

      if (subscriptionResult.length > 0) {
        const sub = subscriptionResult[0];
        const isActive = sub.status === 'active' && sub.endDate > now;

        if (isActive) {
          if (!feature) {
            // Just checking for any active subscription
            hasAccess = true;
          } else {
            // Check if feature is included in plan
            try {
              const features = sub.plan?.features ? JSON.parse(sub.plan.features) : [];
              hasAccess = features.includes(feature);
            } catch (e) {
              console.error('Error parsing subscription features:', e);
              hasAccess = false;
            }
          }
        }
      }

      if (!hasAccess) {
        return res.status(403).json({
          error: feature
            ? `Subscription required for feature: ${feature}`
            : 'Active subscription required'
        });
      }

      req.subscription = subscriptionResult[0] || null;
      next();
    })
    .catch(error => {
      console.error('Error checking subscription:', error);
      res.status(500).json({ error: 'Internal server error' });
    });
  };
}

export async function registerRoutes(app: Express, httpServer?: any, io?: any): Promise<any> {
  // Initialize Stripe (optional for development)
  let stripe: Stripe | null = null;
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
    });
  }

  // Payment retry logic (moved inside registerRoutes to access stripe)
  async function handlePaymentFailure(transactionId: string) {
    try {
      const payment = await db.select().from(payments).where(eq(payments.transactionId, transactionId)).limit(1);
      if (payment.length === 0) {
        console.error('Payment not found for transaction:', transactionId);
        return;
      }

      const p = payment[0];
      if (!p.userId) {
        console.error('Payment has no userId:', p.id);
        return;
      }
      const now = Math.floor(Date.now() / 1000);

      // If already retrying, don't do anything
      if (p.status === 'retrying') return;

      const newRetryCount = (p.retryCount || 0) + 1;
      const maxRetries = p.maxRetries || 5;

      if (newRetryCount > maxRetries) {
        // Max retries reached, mark as permanently failed
        await db.update(payments).set({
          status: 'failed',
          updatedAt: now,
        }).where(eq(payments.id, p.id));

        // Notify user and admin
        await createNotification(p.userId, 'payment_failed', 'Payment Failed', `Your payment of ${(p.amount / 100).toFixed(2)} has failed after ${maxRetries} attempts.`, { paymentId: p.id });
        // Notify admin
        const admins = await db.select().from(users).where(eq(users.role, 'admin'));
        for (const admin of admins) {
          await createNotification(admin.id, 'payment_failed', 'Payment Failed', `Payment ${p.id} for user ${p.userId} has failed after ${maxRetries} attempts.`, { paymentId: p.id, userId: p.userId });
        }
        return;
      }

      // Calculate next retry time with exponential backoff: 1min, 2min, 4min, 8min, 16min, etc.
      const delayMinutes = Math.pow(2, newRetryCount - 1);
      const nextRetryAt = now + (delayMinutes * 60);

      await db.update(payments).set({
        status: 'retrying',
        retryCount: newRetryCount,
        nextRetryAt,
        updatedAt: now,
      }).where(eq(payments.id, p.id));

      // Notify user about retry attempt
      await createNotification(p.userId, 'payment_retry', 'Payment Retry Scheduled', `Your payment of ${(p.amount / 100).toFixed(2)} failed. We'll retry in ${delayMinutes} minute(s).`, { paymentId: p.id, retryAttempt: newRetryCount });

      console.log(`Payment ${p.id} scheduled for retry ${newRetryCount}/${maxRetries} at ${new Date(nextRetryAt * 1000).toISOString()}`);
    } catch (error) {
      console.error('Error handling payment failure:', error);
    }
  }

  async function processPaymentRetries() {
    try {
      const now = Math.floor(Date.now() / 1000);

      const retryPayments = await db.select().from(payments).where(
        and(
          eq(payments.status, 'retrying'),
          lte(payments.nextRetryAt, now)
        )
      );

      for (const payment of retryPayments) {
        await retryPayment(payment);
      }
    } catch (error) {
      console.error('Error processing payment retries:', error);
    }
  }

  async function retryPayment(payment: any) {
    try {
      if (!stripe) {
        console.error('Stripe not configured for payment retry');
        return;
      }

      const now = Math.floor(Date.now() / 1000);

      // Create new payment intent for retry
      const paymentIntent = await stripe.paymentIntents.create({
        amount: payment.amount,
        currency: payment.currency.toLowerCase(),
        description: payment.description,
        metadata: {
          userId: payment.userId,
          subscriptionId: payment.subscriptionId || '',
          retryAttempt: payment.retryCount,
        },
      });

      // Update payment with new transaction ID and reset to pending
      await db.update(payments).set({
        transactionId: paymentIntent.id,
        status: 'pending',
        updatedAt: now,
      }).where(eq(payments.id, payment.id));

      console.log(`Payment ${payment.id} retry initiated with new transaction ${paymentIntent.id}`);
    } catch (error) {
      console.error(`Error retrying payment ${payment.id}:`, error);
      // If retry fails, treat it as another failure
      await handlePaymentFailure(payment.transactionId);
    }
  }

  // Seed sample courses and users
  await seedUsers();
  await seedTutorAssignments();
  await seedTutorRequests();
  await seedCourses();
  await seedMaterials();
  await seedLiveSessions();
  await seedSubscriptionPlans();
  await seedAnalytics();

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      const userResult = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (userResult.length === 0 || userResult[0].password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const user = userResult[0];
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          selectedCourses: JSON.parse(user.selectedCourses || '[]'),
          username: user.username,
          createdAt: user.createdAt,
        },
        token,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, email, password, name, role } = req.body;

      const existingUser = await db.select().from(users).where(
        eq(users.email, email)
      ).limit(1);

      if (existingUser.length > 0) {
        return res.status(400).json({ error: "User already exists" });
      }

      // For unauthenticated registration, only allow student role
      const requestedRole = role || "student";
      if (requestedRole !== "student") {
        return res.status(403).json({ error: "Only student accounts can be created without authentication" });
      }

      const hashedPassword = password;

      const newUser = await db.insert(users).values({
        id: randomUUID(),
        username,
        email,
        password: hashedPassword,
        name,
        role: requestedRole,
        selectedCourses: requestedRole === "student" ? '["1"]' : "[]",
      }).returning();

      const token = jwt.sign({ userId: newUser[0].id }, JWT_SECRET, { expiresIn: "7d" });

      res.json({
        user: {
          id: newUser[0].id,
          name: newUser[0].name,
          email: newUser[0].email,
          role: newUser[0].role,
          selectedCourses: JSON.parse(newUser[0].selectedCourses || '[]'),
          username: newUser[0].username,
          createdAt: newUser[0].createdAt,
        },
        token,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Course routes
  app.get("/api/courses", async (req, res) => {
    try {
      const allCourses = await db.select().from(courses);
      res.json(allCourses);
    } catch (error) {
      console.error("Get courses error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/courses", authenticateToken, requireRole(['admin', 'lecturer']), async (req, res) => {
    try {
      const { name, code, category, description, lecturerId } = req.body;
      const newCourse = await db.insert(courses).values({
        id: randomUUID(),
        name,
        code,
        category,
        description,
        lecturerId,
      }).returning();
      res.json(newCourse[0]);
    } catch (error) {
      console.error("Create course error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Live session routes
  app.get("/api/sessions", async (req, res) => {
    try {
      const allSessions = await db.select().from(liveSessions);
      res.json(allSessions);
    } catch (error) {
      console.error("Get sessions error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/sessions", authenticateToken, requireRole('lecturer'), async (req, res) => {
    try {
      const { courseId, lecturerId, topic, scheduledTime } = req.body;
      console.log("Creating session with", { courseId, lecturerId, topic, scheduledTime });

      // Check if lecturer exists
      const lecturer = await db.select().from(users).where(eq(users.id, lecturerId)).limit(1);
      if (lecturer.length === 0) {
        console.log("Lecturer not found:", lecturerId);
        return res.status(400).json({ error: "Lecturer not found" });
      }

      // Check if lecturer already has a live session
      const existingLiveSession = await db.select().from(liveSessions)
        .where(and(eq(liveSessions.lecturerId, lecturerId), eq(liveSessions.isLive, 1)))
        .limit(1);

      if (existingLiveSession.length > 0) {
        console.log("Lecturer already has a live session:", existingLiveSession[0].id);
        return res.status(400).json({ error: "You already have an active live session. Please end it before starting a new one." });
      }

      // Check if course exists
      const course = await db.select().from(courses).where(eq(courses.id, courseId)).limit(1);
      if (course.length === 0) {
        console.log("Course not found:", courseId);
        return res.status(400).json({ error: "Course not found" });
      }
      const lecturerName = lecturer[0].name || lecturer[0].email.split('@')[0];
      const newSession = await db.insert(liveSessions).values({
        id: randomUUID(),
        courseId,
        lecturerId,
        topic,
        scheduledTime: scheduledTime ? Math.floor(new Date(scheduledTime).getTime() / 1000) : null,
        startTime: !scheduledTime ? Math.floor(Date.now() / 1000) : null, // Set start time for live sessions
        isLive: !scheduledTime ? 1 : 0, // Live if no scheduled time, scheduled if has time
        lecturerName,
      }).returning();

      // Notify all connected clients about the new live session
      if (io && newSession[0].isLive) {
        io.emit("session-started", { session: newSession[0] });
      }

      res.json(newSession[0]);
    } catch (error) {
      console.error("Create session error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/sessions/:id/end", async (req, res) => {
    try {
      const { id } = req.params;
      const updatedSession = await db.update(liveSessions)
        .set({ isLive: 0, endTime: Math.floor(Date.now() / 1000) })
        .where(eq(liveSessions.id, id))
        .returning();
      if (updatedSession.length === 0) {
        return res.status(404).json({ error: "Session not found" });
      }

      // Notify all participants in the session that it has ended
      if (io) {
        io.to(id).emit("session-ended", { sessionId: id });
        console.log(`Emitted session-ended event for session ${id}`);
      }

      res.json(updatedSession[0]);
    } catch (error) {
      console.error("End session error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/sessions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(liveSessions).where(eq(liveSessions.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error("Delete session error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update document state in session
  app.put("/api/sessions/:id/document", async (req, res) => {
    try {
      const { id } = req.params;
      const { currentDocument, currentPage, annotations, currentTool } = req.body;

      const updateData: any = {};
      if (currentDocument !== undefined) updateData.currentDocument = currentDocument ? JSON.stringify(currentDocument) : null;
      if (currentPage !== undefined) updateData.currentPage = currentPage;
      if (annotations !== undefined) updateData.annotations = JSON.stringify(annotations);
      if (currentTool !== undefined) updateData.currentTool = currentTool;

      const updatedSession = await db.update(liveSessions)
        .set(updateData)
        .where(eq(liveSessions.id, id))
        .returning();

      if (updatedSession.length === 0) {
        return res.status(404).json({ error: "Session not found" });
      }

      res.json(updatedSession[0]);
    } catch (error) {
      console.error("Update document state error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Chat routes
  app.get("/api/sessions/:sessionId/messages", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const messages = await db.select().from(chatMessages).where(
        eq(chatMessages.sessionId, sessionId)
      ).orderBy(chatMessages.timestamp);
      res.json(messages);
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      const { sessionId, userId, message } = req.body;
      const newMessage = await db.insert(chatMessages).values({
        id: randomUUID(),
        sessionId,
        userId,
        message,
      }).returning();
      res.json(newMessage[0]);
    } catch (error) {
      console.error("Create message error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Document sharing routes
  app.post("/api/documents", async (req, res) => {
    try {
      const { sessionId, userId, title, fileUrl, fileType } = req.body;
      const newDocument = await db.insert(sharedDocuments).values({
        id: randomUUID(),
        sessionId,
        userId,
        title,
        fileUrl,
        fileType,
      }).returning();
      res.json(newDocument[0]);
    } catch (error) {
      console.error("Share document error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Lecturer materials routes
  app.get("/api/materials", async (req, res) => {
    try {
      const { lecturerId, courseIds, limit = '50', offset = '0' } = req.query;
      console.log('GET /api/materials called with lecturerId:', lecturerId, 'courseIds:', courseIds);
      const limitNum = parseInt(limit as string, 10);
      const offsetNum = parseInt(offset as string, 10);

      // Normalize lecturer IDs
      let lecturerIds: string[] = [];
      if (lecturerId) {
        if (Array.isArray(lecturerId)) {
          lecturerIds = lecturerId.filter((id) => typeof id === 'string' && id.trim()).map((id) => (id as string).trim());
        } else if (typeof lecturerId === 'string') {
          lecturerIds = lecturerId.split(',').filter(id => id.trim());
        }
      }

      // Validate lecturer IDs exist and are lecturers
      if (lecturerIds.length > 0) {
        const existingLecturers = await db.select().from(users).where(and(inArray(users.id, lecturerIds), eq(users.role, 'lecturer')));
        if (existingLecturers.length !== lecturerIds.length) {
          return res.status(400).json({ error: "One or more lecturers not found" });
        }
      }

      // Create cache key
      const lecturerIdsStr = lecturerIds.sort().join(',');
      const courseIdsStr = courseIds ? (courseIds as string).split(',').sort().join(',') : '';
      const cacheKey = lecturerIdsStr
        ? `materials_${lecturerIdsStr}_${limit}_${offset}`
        : courseIdsStr
        ? `materials_courses_${courseIdsStr}_${limit}_${offset}`
        : `materials_all_${limit}_${offset}`;

      const now = Date.now();
      const cached = materialsCache.get(cacheKey);

      if (cached && (now - cached.timestamp) < CACHE_TTL) {
        console.log('Returning cached data for', cacheKey, 'length:', cached.data.length);
        return res.json(cached.data);
      }

      const selectFields = {
        id: lecturerMaterials.id,
        lecturerId: lecturerMaterials.lecturerId,
        courseId: lecturerMaterials.courseId,
        title: lecturerMaterials.title,
        description: lecturerMaterials.description,
        fileUrl: lecturerMaterials.fileUrl,
        fileType: lecturerMaterials.fileType,
        size: lecturerMaterials.size,
        createdAt: lecturerMaterials.createdAt,
        isDeleted: lecturerMaterials.isDeleted,
      };

      const conditions = [eq(lecturerMaterials.isDeleted, 0)];

      if (lecturerIds.length > 0) {
        console.log('Building or condition with lecturerIds:', lecturerIds);
        // For lecturers, return materials they uploaded or materials in courses they teach
        conditions.push(or(
          inArray(lecturerMaterials.lecturerId, lecturerIds),
          inArray(courses.lecturerId, lecturerIds)
        ) as SQL<boolean>);
      }

      if (courseIds) {
        const courseIdArray = (courseIds as string).split(',').filter(id => id.trim());
        if (courseIdArray.length > 0) {
          conditions.push(inArray(lecturerMaterials.courseId, courseIdArray));
        }
      }

      const whereCondition = conditions.length > 1 ? and(...conditions) : conditions[0];

      console.log('Querying materials with whereCondition:', whereCondition);
      const query = db.select(selectFields).from(lecturerMaterials).leftJoin(courses, eq(lecturerMaterials.courseId, courses.id)).where(whereCondition).limit(limitNum).offset(offsetNum);

      const allMaterials = await query;
      console.log('Found materials:', allMaterials.length);

      // Fallback sample materials if database is empty
      let materialsWithUrls = allMaterials.map(material => ({
        ...material,
        url: material.fileUrl ? `${req.protocol}://${req.get('host')}${material.fileUrl}` : null,
      }));

      // If no materials found, provide sample materials for testing
      if (materialsWithUrls.length === 0) {
        console.log('No materials found, providing sample materials');
        const sampleCourseId = courseIds ? (courseIds as string).split(',')[0] : '1';
        materialsWithUrls = [
          {
            id: 'sample-1',
            lecturerId: 'lecturer-1',
            courseId: sampleCourseId,
            title: 'Introduction to Programming',
            description: 'Basic concepts of programming and algorithms',
            fileUrl: null,
            fileType: 'text/plain',
            size: 1024,
            createdAt: Math.floor(Date.now() / 1000),
            isDeleted: 0,
            url: null,
          },
          {
            id: 'sample-2',
            lecturerId: 'lecturer-1',
            courseId: sampleCourseId,
            title: 'Data Structures Notes',
            description: 'Notes on arrays, linked lists, and basic data structures',
            fileUrl: null,
            fileType: 'text/plain',
            size: 2048,
            createdAt: Math.floor(Date.now() / 1000),
            isDeleted: 0,
            url: null,
          },
          {
            id: 'sample-3',
            lecturerId: 'lecturer-1',
            courseId: sampleCourseId,
            title: 'Algorithm Analysis',
            description: 'Time and space complexity analysis',
            fileUrl: null,
            fileType: 'text/plain',
            size: 1536,
            createdAt: Math.floor(Date.now() / 1000),
            isDeleted: 0,
            url: null,
          },
        ];
      }

      // Cache the result
      materialsCache.set(cacheKey, { data: materialsWithUrls, timestamp: now });

      res.json(materialsWithUrls);
    } catch (error) {
      console.error("Get materials error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/materials", upload.single('file'), async (req, res) => {
    try {
      console.log('Received upload request');
      console.log('Request body:', req.body);
      console.log('File received:', req.file ? { name: req.file.originalname, size: req.file.size, mimetype: req.file.mimetype } : 'No file');

      const { lecturerId, courseId, title, description, fileType, content } = req.body;

      let fileUrl = null;
      let fileContent = content;
      let size = null;
      if (req.file) {
        fileContent = req.file.buffer.toString('base64');
        size = req.file.size;
        console.log('Converting file to base64, length:', fileContent.length);
      } else if (content) {
        size = Buffer.byteLength(content, 'utf8');
        console.log('Using provided content, size:', size);
      }

      console.log('Inserting into database...');
      const newMaterial = await db.insert(lecturerMaterials).values({
        id: randomUUID(),
        lecturerId,
        courseId,
        title,
        description,
        fileUrl,
        fileType: fileType || (req.file ? req.file.mimetype : null),
        content: fileContent,
        size,
      }).returning();
      console.log('Material inserted:', newMaterial[0].id);

      // Track analytics for material upload
      await db.insert(userAnalytics).values({
        id: randomUUID(),
        userId: lecturerId,
        metric: 'materials_uploaded',
        value: 1,
        date: Math.floor(Date.now() / 1000),
      });

      // Set fileUrl after insertion if there's a file
      if (req.file) {
        fileUrl = `/api/files/${newMaterial[0].id}`;
        console.log('Updating fileUrl...');
        await db.update(lecturerMaterials).set({ fileUrl }).where(eq(lecturerMaterials.id, newMaterial[0].id));
        newMaterial[0].fileUrl = fileUrl;
        console.log('FileUrl updated');
      }

      console.log('Upload successful, responding with:', newMaterial[0].title);
      res.json(newMaterial[0]);

      // Invalidate cache
      for (const key of materialsCache.keys()) {
        if (key.startsWith('materials_')) {
          materialsCache.delete(key);
        }
      }

      // Emit real-time update
      if (io) {
        io.emit('material-updated', { courseId });
      }
    } catch (error) {
      console.error("Create material error:", error);
      console.error("Error details:", error instanceof Error ? error.message : error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/materials/:id", async (req, res) => {
    try {
      const { id } = req.params;

      // Get the material
      const material = await db.select().from(lecturerMaterials).where(and(eq(lecturerMaterials.id, id), eq(lecturerMaterials.isDeleted, 0))).limit(1);
      if (material.length === 0) {
        return res.status(404).json({ error: "Material not found" });
      }

      // Move to deleted_materials
      await db.insert(deletedMaterials).values({
        id: randomUUID(),
        originalId: id,
        lecturerId: material[0].lecturerId,
        courseId: material[0].courseId,
        title: material[0].title,
        description: material[0].description,
        fileUrl: material[0].fileUrl,
        fileType: material[0].fileType,
        content: material[0].content,
        size: material[0].size,
        createdAt: material[0].createdAt,
      });

      // Mark as deleted
      await db.update(lecturerMaterials).set({ isDeleted: 1 }).where(eq(lecturerMaterials.id, id));

      res.json({ success: true });

      // Invalidate cache
      for (const key of materialsCache.keys()) {
        if (key.startsWith('materials_')) {
          materialsCache.delete(key);
        }
      }

      // Emit update
      if (io) {
        io.emit('material-updated', { courseId: material[0].courseId });
      }
    } catch (error) {
      console.error("Delete material error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Debug route to list all materials
  app.get("/api/debug/materials", async (req, res) => {
    try {
      const allMaterials = await db.select().from(lecturerMaterials).where(eq(lecturerMaterials.isDeleted, 0));
      res.json(allMaterials);
    } catch (error) {
      console.error("Debug materials error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Debug route to check tutor assignments
  app.get("/api/debug/assignments", async (req, res) => {
    try {
      const assignments = await db.select().from(userTutors);
      const requests = await db.select().from(tutorRequests);
      res.json({ assignments, requests });
    } catch (error) {
      console.error("Debug assignments error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Debug route to list all tutor requests
  app.get("/api/debug/requests", async (req, res) => {
    try {
      const requests = await db.select().from(tutorRequests);
      res.json(requests);
    } catch (error) {
      console.error("Debug requests error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // File retrieval endpoint
  app.get("/api/files/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const material = await db.select().from(lecturerMaterials).where(and(eq(lecturerMaterials.id, id), eq(lecturerMaterials.isDeleted, 0))).limit(1);

      if (material.length === 0 || !material[0].content) {
        return res.status(404).json({ error: "File not found" });
      }

      const fileBuffer = Buffer.from(material[0].content, 'base64');
      const mimeType = material[0].fileType || 'application/octet-stream';

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${material[0].title}"`);
      res.send(fileBuffer);
    } catch (error) {
      console.error("File retrieval error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Tutor request routes
  app.get("/api/tutor-requests", authenticateToken, async (req, res) => {
    try {
      console.log('GET /api/tutor-requests called by userId:', req.user!.userId);
      const { studentId: studentIdParam, limit = '10', offset = '0', status } = req.query;
      const studentId = typeof studentIdParam === 'string' ? studentIdParam : undefined;
      const limitNum = parseInt(limit as string, 10);
      const offsetNum = parseInt(offset as string, 10);
      const userId = req.user!.userId;

      // Get user details to check role
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (user.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      const userRole = user[0].role;
      console.log('User role:', userRole, 'for userId:', userId);

      let requests: typeof tutorRequests.$inferSelect[] = [];
      if (studentId) {
        // Students see their own requests
        if (userRole === 'student' && studentId !== userId) {
          return res.status(403).json({ error: "Access denied" });
        }
        requests = await db.select().from(tutorRequests).where(eq(tutorRequests.studentId, studentId));
        console.log('Debug: requests assigned for studentId, length:', requests.length);
      } else {
        if (userRole === 'student') {
          // Students see their own requests
          requests = await db.select().from(tutorRequests).where(eq(tutorRequests.studentId, userId));
          console.log('Debug: requests assigned for student, length:', requests.length);
        } else if (userRole === 'tutor') {
          // Tutors see all requests
          requests = await db.select().from(tutorRequests);
          console.log('Debug: requests assigned for tutor, length:', requests.length);
        } else {
          // Admins and lecturers see all requests
          requests = await db.select().from(tutorRequests);
          console.log('Debug: requests assigned for admin/lecturer, length:', requests.length);
        }
      }

      // Apply status filter if provided
      if (status) {
        requests = requests.filter(r => r.status === status);
      }

      // Apply pagination
      const total = requests.length;
      requests = requests.slice(offsetNum, offsetNum + limitNum);

      res.json({ requests, total });
    } catch (error) {
      console.error("Get tutor requests error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/tutor-requests", authenticateToken, async (req, res) => {
    try {
      const { courseId, type, title, description, messages } = req.body;
      const studentId = req.user!.userId;
      console.log('Debug: Creating tutor request for studentId:', studentId, 'courseId:', courseId, 'title:', title);

      const newRequest = await db.insert(tutorRequests).values({
        id: randomUUID(),
        studentId,
        courseId,
        type,
        title,
        description,
        messages,
      }).returning();
      console.log('Debug: Tutor request created successfully, id:', newRequest[0].id);

      res.json(newRequest[0]);
    } catch (error) {
      console.error("Create tutor request error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/tutor-requests/:id", authenticateToken, requireRole(['student', 'tutor', 'lecturer', 'admin']), async (req, res) => {
    try {
      const { id } = req.params;
      const { status, response, messages } = req.body;
      const userId = req.user!.userId;
      const userRole = req.userDetails.role;

      // Check permissions
      if (userRole === 'student') {
        // Students can only update their own requests
        const request = await db.select().from(tutorRequests).where(eq(tutorRequests.id, id)).limit(1);
        if (request.length === 0 || request[0].studentId !== userId) {
          return res.status(403).json({ error: "Access denied" });
        }
      } else if (!['tutor', 'lecturer', 'admin'].includes(userRole)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const updateData: any = { updatedAt: Math.floor(Date.now() / 1000) };
      if (status !== undefined) updateData.status = status;
      if (response !== undefined) updateData.response = response;
      if (messages !== undefined) updateData.messages = messages;

      const updatedRequest = await db.update(tutorRequests)
        .set(updateData)
        .where(eq(tutorRequests.id, id))
        .returning();

      if (updatedRequest.length === 0) {
        return res.status(404).json({ error: "Request not found" });
      }

      res.json(updatedRequest[0]);
    } catch (error) {
      console.error("Update tutor request error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/tutor-requests/:id", authenticateToken, requireRole('student'), async (req, res) => {
    try {
      const { id } = req.params;
      const studentId = req.user!.userId;

      // Check if the request belongs to the student
      const request = await db.select().from(tutorRequests).where(eq(tutorRequests.id, id)).limit(1);
      if (request.length === 0 || request[0].studentId !== studentId) {
        return res.status(403).json({ error: "Access denied" });
      }

      await db.delete(tutorRequests).where(eq(tutorRequests.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error("Delete tutor request error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Send message to tutor request
  app.post("/api/tutor-requests/:id/message", authenticateToken, requireRole(['student', 'tutor', 'lecturer']), async (req, res) => {
    try {
      const { id } = req.params;
      const { message } = req.body;
      const userId = req.user!.userId;
      const userRole = req.userDetails.role;

      // Get the current request
      const request = await db.select().from(tutorRequests).where(eq(tutorRequests.id, id)).limit(1);
      if (request.length === 0) {
        return res.status(404).json({ error: "Request not found" });
      }

      const tutorRequest = request[0];

      // Check permissions - both students and tutors can send messages on their requests
      if (userRole === 'student' && tutorRequest.studentId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      if (userRole === 'tutor') {
        // Check if tutor is assigned to this student
        const assignment = await db.select().from(userTutors)
          .where(and(eq(userTutors.studentId, tutorRequest.studentId!), eq(userTutors.tutorId, userId)))
          .limit(1);
        if (assignment.length === 0) {
          return res.status(403).json({ error: "Access denied" });
        }
      } else if (userRole === 'lecturer') {
        // Lecturers can send messages on any request
      } else if (!['student', 'tutor', 'lecturer'].includes(userRole)) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Parse existing messages
      let messages = [];
      try {
        messages = tutorRequest.messages ? JSON.parse(tutorRequest.messages) : [];
      } catch (e) {
        messages = [];
      }

      // Add new message
      const newMessage = {
        sender: userRole === 'student' ? 'student' : 'tutor',
        message: message.trim(),
        timestamp: Date.now(),
        status: 'sent'
      };
      messages.push(newMessage);

      // Update the request
      const updatedRequest = await db.update(tutorRequests)
        .set({
          messages: JSON.stringify(messages),
          updatedAt: Math.floor(Date.now() / 1000)
        })
        .where(eq(tutorRequests.id, id))
        .returning();

      if (updatedRequest.length === 0) {
        return res.status(404).json({ error: "Request not found" });
      }

      res.json(updatedRequest[0]);
    } catch (error) {
      console.error("Send message error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin routes
  app.get("/api/admin/users", authenticateToken, requireRole(['admin', 'tutor']), async (req, res) => {
    try {
      const allUsers = await db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
      }).from(users);
      res.json(allUsers);
    } catch (error) {
      console.error("Get admin users error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/users", authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const { username, email, password, name, role } = req.body;

      const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existingUser.length > 0) {
        return res.status(400).json({ error: "User already exists" });
      }

      const newUser = await db.insert(users).values({
        id: randomUUID(),
        username,
        email,
        password, // Note: should hash in production
        name,
        role: role || "student",
        selectedCourses: "[]",
      }).returning();

      res.json({
        id: newUser[0].id,
        username: newUser[0].username,
        email: newUser[0].email,
        name: newUser[0].name,
        role: newUser[0].role,
        createdAt: newUser[0].createdAt,
      });
    } catch (error) {
      console.error("Admin create user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/admin/users/:id", authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const { id } = req.params;
      const { name, role, selectedCourses } = req.body;

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (role !== undefined) updateData.role = role;
      if (selectedCourses !== undefined) updateData.selectedCourses = JSON.stringify(selectedCourses);

      const updatedUser = await db.update(users)
        .set(updateData)
        .where(eq(users.id, id))
        .returning();

      if (updatedUser.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        id: updatedUser[0].id,
        username: updatedUser[0].username,
        email: updatedUser[0].email,
        name: updatedUser[0].name,
        role: updatedUser[0].role,
        createdAt: updatedUser[0].createdAt,
      });
    } catch (error) {
      console.error("Admin update user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/admin/users/:id", authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const { id } = req.params;

      // Prevent deleting self
      if (req.user!.userId === id) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }

      // Check for references in other tables
      const references = [];

      // Check courses
      const courseRefs = await db.select().from(courses).where(eq(courses.lecturerId, id));
      if (courseRefs.length > 0) references.push(`courses (${courseRefs.length})`);

      // Check live sessions
      const sessionRefs = await db.select().from(liveSessions).where(eq(liveSessions.lecturerId, id));
      if (sessionRefs.length > 0) references.push(`live sessions (${sessionRefs.length})`);

      // Check lecturer materials
      const materialRefs = await db.select().from(lecturerMaterials).where(eq(lecturerMaterials.lecturerId, id));
      if (materialRefs.length > 0) references.push(`lecturer materials (${materialRefs.length})`);

      // Check tutor assignments
      const tutorRefs = await db.select().from(userTutors).where(or(eq(userTutors.studentId, id), eq(userTutors.tutorId, id), eq(userTutors.assignedBy, id)));
      if (tutorRefs.length > 0) references.push(`tutor assignments (${tutorRefs.length})`);

      // Check support requests
      const supportRefs = await db.select().from(supportRequests).where(or(eq(supportRequests.userId, id), eq(supportRequests.assignedTo, id)));
      if (supportRefs.length > 0) references.push(`support requests (${supportRefs.length})`);

      if (references.length > 0) {
        return res.status(400).json({
          error: `Cannot delete user because they are referenced in: ${references.join(', ')}. Please reassign or remove these references first.`
        });
      }

      await db.delete(users).where(eq(users.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error("Admin delete user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/admin/users/:id/password", authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const { id } = req.params;
      const { password } = req.body;

      const updatedUser = await db.update(users)
        .set({ password }) // Note: should hash in production
        .where(eq(users.id, id))
        .returning();

      if (updatedUser.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Admin change password error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Support requests admin routes
  app.get("/api/admin/support", authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const requests = await db.select().from(supportRequests);
      res.json(requests);
    } catch (error) {
      console.error("Get support requests error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/support", authenticateToken, async (req, res) => {
    try {
      const { type, title, description } = req.body;
      const userId = req.user!.userId;

      const newRequest = await db.insert(supportRequests).values({
        id: randomUUID(),
        userId,
        type,
        title,
        description,
      }).returning();

      res.json(newRequest[0]);
    } catch (error) {
      console.error("Create support request error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/admin/support/:id", authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const { id } = req.params;
      const { status, assignedTo } = req.body;

      const updateData: any = { updatedAt: Math.floor(Date.now() / 1000) };
      if (status !== undefined) updateData.status = status;
      if (assignedTo !== undefined) updateData.assignedTo = assignedTo;

      const updatedRequest = await db.update(supportRequests)
        .set(updateData)
        .where(eq(supportRequests.id, id))
        .returning();

      if (updatedRequest.length === 0) {
        return res.status(404).json({ error: "Support request not found" });
      }

      res.json(updatedRequest[0]);
    } catch (error) {
      console.error("Update support request error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Analytics routes
  app.get("/api/admin/analytics", authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const analytics = await db.select().from(userAnalytics);
      res.json(analytics);
    } catch (error) {
      console.error("Get analytics error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/analytics", authenticateToken, async (req, res) => {
    try {
      const { userId, metric, value, date } = req.body;
      await db.insert(userAnalytics).values({
        id: randomUUID(),
        userId,
        metric,
        value,
        date,
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Track analytics error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin payment analytics routes
  app.get("/api/admin/payments/analytics", authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      console.log('Payment analytics route called');
      const { startDate, endDate } = req.query;

      // Convert dates to timestamps
      const startTimestamp = startDate ? Math.floor(new Date(startDate as string).getTime() / 1000) : 0;
      const endTimestamp = endDate ? Math.floor(new Date(endDate as string).getTime() / 1000) : Math.floor(Date.now() / 1000);

      // Total revenue
      const revenueResult = await db.select({
        totalRevenue: sql<number>`SUM(${payments.amount})`,
        totalTransactions: sql<number>`COUNT(*)`,
      })
      .from(payments)
      .where(and(
        eq(payments.status, 'completed'),
        gte(payments.createdAt, startTimestamp),
        lte(payments.createdAt, endTimestamp)
      ));

      // Revenue by currency
      const revenueByCurrency = await db.select({
        currency: payments.currency,
        revenue: sql<number>`SUM(${payments.amount})`,
        transactions: sql<number>`COUNT(*)`,
      })
      .from(payments)
      .where(and(
        eq(payments.status, 'completed'),
        gte(payments.createdAt, startTimestamp),
        lte(payments.createdAt, endTimestamp)
      ))
      .groupBy(payments.currency);

      // Revenue by payment method
      const revenueByMethod = await db.select({
        paymentMethod: payments.paymentMethod,
        revenue: sql<number>`SUM(${payments.amount})`,
        transactions: sql<number>`COUNT(*)`,
      })
      .from(payments)
      .where(and(
        eq(payments.status, 'completed'),
        gte(payments.createdAt, startTimestamp),
        lte(payments.createdAt, endTimestamp)
      ))
      .groupBy(payments.paymentMethod);

      // Recent payments
      const recentPayments = await db.select({
        id: payments.id,
        userId: payments.userId,
        amount: payments.amount,
        currency: payments.currency,
        status: payments.status,
        paymentMethod: payments.paymentMethod,
        createdAt: payments.createdAt,
        user: {
          name: users.name,
          email: users.email,
        }
      })
      .from(payments)
      .leftJoin(users, eq(payments.userId, users.id))
      .orderBy(payments.createdAt)
      .limit(50);

      // Subscription analytics
      const activeSubscriptions = await db.select({
        count: sql<number>`COUNT(*)`,
      })
      .from(userSubscriptions)
      .where(eq(userSubscriptions.status, 'active'));

      const subscriptionRevenue = await db.select({
        revenue: sql<number>`SUM(${subscriptionPlans.price})`,
        subscriptions: sql<number>`COUNT(*)`,
      })
      .from(userSubscriptions)
      .leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
      .where(and(
        eq(userSubscriptions.status, 'active'),
        gte(userSubscriptions.createdAt, startTimestamp),
        lte(userSubscriptions.createdAt, endTimestamp)
      ));

      res.json({
        overview: {
          totalRevenue: revenueResult[0]?.totalRevenue || 0,
          totalTransactions: revenueResult[0]?.totalTransactions || 0,
          activeSubscriptions: activeSubscriptions[0]?.count || 0,
          subscriptionRevenue: subscriptionRevenue[0]?.revenue || 0,
          totalSubscriptionCount: subscriptionRevenue[0]?.subscriptions || 0,
        },
        revenueByCurrency,
        revenueByMethod,
        recentPayments,
        dateRange: {
          startDate: startDate || 'all',
          endDate: endDate || 'now',
        }
      });
    } catch (error) {
      console.error("Get payment analytics error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/admin/payments", authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const { limit = '50', offset = '0', status, userId, startDate, endDate } = req.query;
      const limitNum = parseInt(limit as string, 10);
      const offsetNum = parseInt(offset as string, 10);

      let conditions = [];

      if (status) {
        conditions.push(eq(payments.status, status as string));
      }

      if (userId) {
        conditions.push(eq(payments.userId, userId as string));
      }

      if (startDate) {
        conditions.push(gte(payments.createdAt, Math.floor(new Date(startDate as string).getTime() / 1000)));
      }

      if (endDate) {
        conditions.push(lte(payments.createdAt, Math.floor(new Date(endDate as string).getTime() / 1000)));
      }

      const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

      const paymentsList = await db.select({
        id: payments.id,
        userId: payments.userId,
        subscriptionId: payments.subscriptionId,
        amount: payments.amount,
        currency: payments.currency,
        status: payments.status,
        paymentMethod: payments.paymentMethod,
        transactionId: payments.transactionId,
        description: payments.description,
        createdAt: payments.createdAt,
        user: {
          name: users.name,
          email: users.email,
        }
      })
      .from(payments)
      .leftJoin(users, eq(payments.userId, users.id))
      .where(whereCondition)
      .orderBy(payments.createdAt)
      .limit(limitNum)
      .offset(offsetNum);

      // Get total count for pagination
      const totalResult = await db.select({
        count: sql<number>`COUNT(*)`,
      })
      .from(payments)
      .where(whereCondition);

      res.json({
        payments: paymentsList,
        total: totalResult[0]?.count || 0,
        limit: limitNum,
        offset: offsetNum,
      });
    } catch (error) {
      console.error("Get admin payments error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Subscription analytics
  app.get("/api/admin/subscriptions/analytics", authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      const startTimestamp = startDate ? Math.floor(new Date(startDate as string).getTime() / 1000) : 0;
      const endTimestamp = endDate ? Math.floor(new Date(endDate as string).getTime() / 1000) : Math.floor(Date.now() / 1000);

      // Subscription status breakdown
      const statusBreakdown = await db.select({
        status: userSubscriptions.status,
        count: sql<number>`COUNT(*)`,
      })
      .from(userSubscriptions)
      .where(and(
        gte(userSubscriptions.createdAt, startTimestamp),
        lte(userSubscriptions.createdAt, endTimestamp)
      ))
      .groupBy(userSubscriptions.status);

      // Popular plans
      const popularPlans = await db.select({
        planId: subscriptionPlans.id,
        planName: subscriptionPlans.name,
        price: subscriptionPlans.price,
        currency: subscriptionPlans.currency,
        count: sql<number>`COUNT(*)`,
        revenue: sql<number>`SUM(${subscriptionPlans.price})`,
      })
      .from(userSubscriptions)
      .leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
      .where(and(
        eq(userSubscriptions.status, 'active'),
        gte(userSubscriptions.createdAt, startTimestamp),
        lte(userSubscriptions.createdAt, endTimestamp)
      ))
      .groupBy(subscriptionPlans.id, subscriptionPlans.name, subscriptionPlans.price, subscriptionPlans.currency)
      .orderBy(sql`COUNT(*) DESC`);

      // Churn analysis (cancelled vs active)
      const churnData = await db.select({
        status: userSubscriptions.status,
        count: sql<number>`COUNT(*)`,
      })
      .from(userSubscriptions)
      .where(gte(userSubscriptions.updatedAt, startTimestamp))
      .groupBy(userSubscriptions.status);

      res.json({
        statusBreakdown,
        popularPlans,
        churnData,
        dateRange: {
          startDate: startDate || 'all',
          endDate: endDate || 'now',
        }
      });
    } catch (error) {
      console.error("Get subscription analytics error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Overdue students endpoint
  app.get("/api/admin/overdue-students", authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const now = Math.floor(Date.now() / 1000);

      // Get students with expired subscriptions
      const overdueSubscriptions = await db.select({
        userId: userSubscriptions.userId,
        endDate: userSubscriptions.endDate,
      })
      .from(userSubscriptions)
      .where(and(
        eq(userSubscriptions.status, 'active'),
        lte(userSubscriptions.endDate, now)
      ));

      if (overdueSubscriptions.length === 0) {
        return res.json([]);
      }

      // Get user details for these students
      const userIds = overdueSubscriptions.map(sub => sub.userId).filter(id => id !== null) as string[];
      const userDetails = await db.select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(inArray(users.id, userIds));

      // Combine data
      const overdueStudents = userDetails.map((user: any) => {
        const subscription = overdueSubscriptions.find(sub => sub.userId === user.id);
        const daysOverdue = subscription ? Math.floor((now - subscription.endDate) / (24 * 60 * 60)) : 0;

        return {
          userId: user.id,
          name: user.name,
          email: user.email,
          endDate: subscription?.endDate || 0,
          daysOverdue,
        };
      }).sort((a: any, b: any) => b.daysOverdue - a.daysOverdue); // Sort by most overdue first

      res.json(overdueStudents);
    } catch (error) {
      console.error("Get overdue students error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // User analytics endpoint
  app.get("/api/admin/users/analytics", authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      const startTimestamp = startDate ? Math.floor(new Date(startDate as string).getTime() / 1000) : 0;
      const endTimestamp = endDate ? Math.floor(new Date(endDate as string).getTime() / 1000) : Math.floor(Date.now() / 1000);

      // User counts by role
      const usersByRole = await db.select({
        role: users.role,
        count: sql<number>`COUNT(*)`,
      })
      .from(users)
      .groupBy(users.role);

      // User registration trends
      const registrationTrends = await db.select({
        date: sql<string>`DATE(${users.createdAt}, 'unixepoch')`,
        count: sql<number>`COUNT(*)`,
      })
      .from(users)
      .where(and(
        gte(users.createdAt, startTimestamp),
        lte(users.createdAt, endTimestamp)
      ))
      .groupBy(sql`DATE(${users.createdAt}, 'unixepoch')`)
      .orderBy(sql`DATE(${users.createdAt}, 'unixepoch')`);

      // Recent users
      const recentUsers = await db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(users.createdAt)
      .limit(10);

      res.json({
        usersByRole,
        registrationTrends,
        recentUsers,
        dateRange: {
          startDate: startDate || 'all',
          endDate: endDate || 'now',
        }
      });
    } catch (error) {
      console.error("Get user analytics error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Course analytics endpoint
  app.get("/api/admin/courses/analytics", authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      // Popular courses by enrollment
      const coursePopularity = await db.select({
        courseId: courses.id,
        courseName: courses.name,
        courseCode: courses.code,
        lecturerName: courses.lecturerName,
        enrollmentCount: sql<number>`COUNT(DISTINCT ${userTutors.studentId})`,
      })
      .from(courses)
      .leftJoin(userTutors, eq(courses.id, userTutors.courseId))
      .groupBy(courses.id, courses.name, courses.code, courses.lecturerName)
      .orderBy(sql`COUNT(DISTINCT ${userTutors.studentId}) DESC`)
      .limit(10);

      // Course categories breakdown
      const coursesByCategory = await db.select({
        category: courses.category,
        count: sql<number>`COUNT(*)`,
      })
      .from(courses)
      .groupBy(courses.category);

      // Total courses and enrollments
      const totalStats = await db.select({
        totalCourses: sql<number>`COUNT(DISTINCT ${courses.id})`,
        totalEnrollments: sql<number>`COUNT(DISTINCT ${userTutors.studentId})`,
        activeTutors: sql<number>`COUNT(DISTINCT ${userTutors.tutorId})`,
      })
      .from(courses)
      .leftJoin(userTutors, eq(courses.id, userTutors.courseId))
      .where(eq(userTutors.status, 'active'));

      res.json({
        popularCourses: coursePopularity,
        coursesByCategory,
        overview: {
          totalCourses: totalStats[0]?.totalCourses || 0,
          totalEnrollments: totalStats[0]?.totalEnrollments || 0,
          activeTutors: totalStats[0]?.activeTutors || 0,
        }
      });
    } catch (error) {
      console.error("Get course analytics error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Support requests analytics endpoint
  app.get("/api/admin/support/analytics", authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      const startTimestamp = startDate ? Math.floor(new Date(startDate as string).getTime() / 1000) : 0;
      const endTimestamp = endDate ? Math.floor(new Date(endDate as string).getTime() / 1000) : Math.floor(Date.now() / 1000);

      // Support requests by status
      const requestsByStatus = await db.select({
        status: supportRequests.status,
        count: sql<number>`COUNT(*)`,
      })
      .from(supportRequests)
      .where(and(
        gte(supportRequests.createdAt, startTimestamp),
        lte(supportRequests.createdAt, endTimestamp)
      ))
      .groupBy(supportRequests.status);

      // Support requests by type
      const requestsByType = await db.select({
        type: supportRequests.type,
        count: sql<number>`COUNT(*)`,
      })
      .from(supportRequests)
      .where(and(
        gte(supportRequests.createdAt, startTimestamp),
        lte(supportRequests.createdAt, endTimestamp)
      ))
      .groupBy(supportRequests.type);

      // Recent support requests
      const recentRequests = await db.select({
        id: supportRequests.id,
        type: supportRequests.type,
        title: supportRequests.title,
        status: supportRequests.status,
        createdAt: supportRequests.createdAt,
        user: {
          name: users.name,
          email: users.email,
        }
      })
      .from(supportRequests)
      .leftJoin(users, eq(supportRequests.userId, users.id))
      .orderBy(supportRequests.createdAt)
      .limit(5);

      // Unresolved requests count
      const unresolvedCount = await db.select({
        count: sql<number>`COUNT(*)`,
      })
      .from(supportRequests)
      .where(ne(supportRequests.status, 'resolved'));

      res.json({
        requestsByStatus,
        requestsByType,
        recentRequests,
        overview: {
          totalRequests: requestsByStatus.reduce((sum, item) => sum + item.count, 0),
          unresolvedRequests: unresolvedCount[0]?.count || 0,
        },
        dateRange: {
          startDate: startDate || 'all',
          endDate: endDate || 'now',
        }
      });
    } catch (error) {
      console.error("Get support analytics error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Tutor assignment routes
  app.get("/api/admin/tutors", authenticateToken, async (req, res) => {
    try {
      const assignments = await db.select().from(userTutors);
      res.json(assignments);
    } catch (error) {
      console.error("Get tutor assignments error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/tutors", authenticateToken, async (req, res) => {
    try {
      const { studentId, tutorId, courseId } = req.body;
      const userId = req.user!.userId;
      const userRole = req.userDetails.role;

      // Allow admins to assign any, tutors to assign themselves to students
      if (userRole !== 'admin' && userRole !== 'tutor') {
        return res.status(403).json({ error: 'Access denied' });
      }
      if (userRole === 'tutor' && tutorId !== userId) {
        return res.status(403).json({ error: 'Tutors can only assign themselves' });
      }

      const assignedBy = userId;

      const newAssignment = await db.insert(userTutors).values({
        id: randomUUID(),
        studentId,
        tutorId,
        courseId,
        assignedBy,
      }).returning();

      res.json(newAssignment[0]);
    } catch (error) {
      console.error("Create tutor assignment error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/admin/tutors/:id", authenticateToken, async (req, res) => {
    // Get user details to check permissions
    const user = await db.select().from(users).where(eq(users.id, req.user!.userId)).limit(1);
    if (user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const userRole = user[0].role;
    const userId = req.user!.userId;
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const userRole = req.userDetails.role;

      // Check if user can delete this assignment
      const assignment = await db.select().from(userTutors).where(eq(userTutors.id, id)).limit(1);
      if (assignment.length === 0) {
        return res.status(404).json({ error: 'Assignment not found' });
      }

      if (userRole !== 'admin' && !(userRole === 'tutor' && assignment[0].tutorId === userId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
      await db.delete(userTutors).where(eq(userTutors.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error("Delete tutor assignment error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // My Tutors routes (for students)
  app.get("/api/my-tutors", authenticateToken, requireRole('student'), async (req, res) => {
    try {
      const studentId = req.user!.userId;

      // Get assigned tutors
      const assignedTutors = await db.select({
        tutor: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
        course: {
          id: courses.id,
          name: courses.name,
          code: courses.code,
        },
        assignedAt: userTutors.assignedAt,
        status: userTutors.status,
      }).from(userTutors)
      .leftJoin(users, eq(userTutors.tutorId, users.id))
      .leftJoin(courses, eq(userTutors.courseId, courses.id))
      .where(and(eq(userTutors.studentId, studentId), eq(userTutors.status, 'active')));

      // Get all requests for debugging
      const debugRequests = await db.select().from(tutorRequests).where(eq(tutorRequests.studentId, studentId));
      console.log('All tutor requests for student', studentId, ':', debugRequests);

      // Get all requests for the student
      const allRequests = await db.select().from(tutorRequests).where(eq(tutorRequests.studentId, studentId));
      console.log('All requests for student', studentId, ':', allRequests);

      res.json({ assignedTutors, requests: allRequests });
    } catch (error) {
      console.error("Get my tutors error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Payment routes (only if Stripe is configured)
  if (stripe) {
    app.post("/api/payments/create-intent", authenticateToken, async (req, res) => {
      try {
        const { amount, currency = 'usd', description, subscriptionId, paymentMethodId } = req.body;
        const userId = req.user!.userId;

        const paymentIntent = await stripe.paymentIntents.create({
          amount: amount * 100, // Stripe expects amount in cents
          currency,
          description,
          metadata: {
            userId,
            subscriptionId: subscriptionId || '',
          },
          payment_method: paymentMethodId,
          confirmation_method: 'manual',
          capture_method: 'automatic',
        });

        // Create payment record in database
        const payment = await db.insert(payments).values({
          id: randomUUID(),
          userId,
          subscriptionId,
          amount,
          currency: currency.toUpperCase(),
          status: 'pending',
          paymentMethod: 'stripe',
          transactionId: paymentIntent.id,
          description,
        }).returning();

        res.json({
          clientSecret: paymentIntent.client_secret,
          paymentId: payment[0].id
        });
      } catch (error) {
        console.error("Create payment intent error:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.post("/api/payments/confirm/:paymentId", authenticateToken, async (req, res) => {
      try {
        const { paymentId } = req.params;
        const { paymentIntentId } = req.body;
        const userId = req.user!.userId;

        // Verify payment belongs to user
        const payment = await db.select().from(payments).where(and(
          eq(payments.id, paymentId),
          eq(payments.userId, userId)
        )).limit(1);

        if (payment.length === 0) {
          return res.status(404).json({ error: "Payment not found" });
        }

        // Confirm with Stripe
        const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId);

        const now = Math.floor(Date.now() / 1000);

        // Update payment status
        const newStatus = paymentIntent.status === 'succeeded' ? 'completed' :
                         paymentIntent.status === 'requires_payment_method' || paymentIntent.status === 'requires_confirmation' ? 'failed' :
                         paymentIntent.status;

        await db.update(payments).set({
          status: newStatus,
          transactionId: paymentIntent.id,
          updatedAt: now,
        }).where(eq(payments.id, paymentId));

        if (newStatus === 'completed') {
          // If payment for subscription, activate it
          if (payment[0].subscriptionId) {
            await db.update(userSubscriptions).set({
              status: 'active',
            }).where(eq(userSubscriptions.id, payment[0].subscriptionId));
          }

          // Notify user of success
          await createNotification(userId, 'payment_success', 'Payment Successful', `Your payment of ${(payment[0].amount / 100).toFixed(2)} has been processed successfully.`, { paymentId });
        } else if (newStatus === 'failed') {
          // Handle payment failure (will initiate retry)
          await handlePaymentFailure(paymentIntent.id);
        }

        res.json({ success: true, status: paymentIntent.status });
      } catch (error) {
        console.error("Confirm payment error:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.post("/api/payments/webhook", async (req, res) => {
      const sig = req.headers['stripe-signature'];
      if (!sig || typeof sig !== 'string') {
        return res.status(400).send('Invalid signature');
      }
      let event;

      try {
        event = stripe.webhooks.constructEvent(req.rawBody as Buffer, sig, process.env.STRIPE_WEBHOOK_SECRET!);
      } catch (err: any) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      try {
        // Handle different event types
        switch (event.type) {
          case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            console.log('Payment succeeded:', paymentIntent.id);

            const now = Math.floor(Date.now() / 1000);

            // Update payment status in database
            const paymentsToUpdate = await db.select().from(payments).where(eq(payments.transactionId, paymentIntent.id));
            for (const payment of paymentsToUpdate) {
              if (!payment.userId) {
                console.error('Payment has no userId:', payment.id);
                continue;
              }
              await db.update(payments).set({
                status: 'completed',
                updatedAt: now,
              }).where(eq(payments.id, payment.id));

              // If payment for subscription, activate it
              if (payment.subscriptionId) {
                await db.update(userSubscriptions).set({
                  status: 'active',
                }).where(eq(userSubscriptions.id, payment.subscriptionId));
              }

              // Notify user of success
              await createNotification(payment.userId, 'payment_success', 'Payment Successful', `Your payment of ${(payment.amount / 100).toFixed(2)} has been processed successfully.`, { paymentId: payment.id });
            }
            break;

          case 'payment_intent.payment_failed':
            const failedPaymentIntent = event.data.object;
            console.log('Payment failed:', failedPaymentIntent.id);

            // Initiate retry logic instead of marking as failed immediately
            await handlePaymentFailure(failedPaymentIntent.id);
            break;

          case 'charge.dispute.created':
            const dispute = event.data.object;
            console.log('Charge disputed:', dispute.id);
            // Handle dispute - could mark payment as disputed
            break;

          default:
            console.log(`Unhandled event type ${event.type}`);
        }

        res.json({ received: true });
      } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
      }
    });
  }

  // Payment history and management (non-Stripe dependent)
  app.get("/api/payments", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.userId;
      const { limit = '20', offset = '0' } = req.query;
      const limitNum = parseInt(limit as string, 10);
      const offsetNum = parseInt(offset as string, 10);

      const userPayments = await db.select()
        .from(payments)
        .where(eq(payments.userId, userId))
        .orderBy(payments.createdAt)
        .limit(limitNum)
        .offset(offsetNum);

      res.json(userPayments);
    } catch (error) {
      console.error("Get payments error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/payments/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const payment = await db.select()
        .from(payments)
        .where(and(eq(payments.id, id), eq(payments.userId, userId)))
        .limit(1);

      if (payment.length === 0) {
        return res.status(404).json({ error: "Payment not found" });
      }

      res.json(payment[0]);
    } catch (error) {
      console.error("Get payment error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/payments/:id/refund", authenticateToken, requireRole(['admin', 'tutor']), async (req, res) => {
    try {
      const { id } = req.params;
      const { amount, reason } = req.body;

      if (!stripe) {
        return res.status(400).json({ error: "Payment processing not configured" });
      }

      const payment = await db.select()
        .from(payments)
        .where(eq(payments.id, id))
        .limit(1);

      if (payment.length === 0) {
        return res.status(404).json({ error: "Payment not found" });
      }

      if (payment[0].status !== 'completed') {
        return res.status(400).json({ error: "Can only refund completed payments" });
      }

      // Create refund with Stripe
      const refund = await stripe.refunds.create({
        payment_intent: payment[0].transactionId!,
        amount: amount ? amount * 100 : undefined, // Partial refund if amount specified
        reason: reason || 'requested_by_customer',
      });

      // Update payment status
      await db.update(payments).set({
        status: refund.amount === payment[0].amount * 100 ? 'refunded' : 'partially_refunded',
      }).where(eq(payments.id, id));

      // If subscription payment, consider deactivating subscription
      if (payment[0].subscriptionId) {
        await db.update(userSubscriptions).set({
          status: 'cancelled',
        }).where(eq(userSubscriptions.id, payment[0].subscriptionId));
      }

      res.json({ success: true, refundId: refund.id });
    } catch (error) {
      console.error("Refund payment error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Notifications
  app.get("/api/notifications", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.userId;
      const { limit = '20', offset = '0' } = req.query;
      const limitNum = parseInt(limit as string, 10);
      const offsetNum = parseInt(offset as string, 10);

      const userNotifications = await db.select().from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(notifications.createdAt)
        .limit(limitNum)
        .offset(offsetNum);

      res.json(userNotifications);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/notifications/:id/read", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const notification = await db.select().from(notifications)
        .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
        .limit(1);

      if (notification.length === 0) {
        return res.status(404).json({ error: "Notification not found" });
      }

      await db.update(notifications).set({ isRead: 1 }).where(eq(notifications.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error("Mark notification read error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Payment methods management
  app.get("/api/payment-methods", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.userId;

      const methods = await db.select()
        .from(paymentMethods)
        .where(eq(paymentMethods.userId, userId))
        .orderBy(paymentMethods.createdAt);

      res.json(methods);
    } catch (error) {
      console.error("Get payment methods error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/payment-methods", authenticateToken, async (req, res) => {
    try {
      const { type, provider, last4, expiryMonth, expiryYear, stripePaymentMethodId } = req.body;
      const userId = req.user!.userId;

      if (!stripe) {
        return res.status(400).json({ error: "Payment processing not configured" });
      }

      // If using Stripe, attach payment method to customer
      let stripeCustomerId: string | undefined;
      if (stripePaymentMethodId) {
        // First, get or create Stripe customer
        const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        if (user.length === 0) {
          return res.status(404).json({ error: "User not found" });
        }

        // For simplicity, we'll use user ID as customer ID
        try {
          const customer = await stripe.customers.create({
            email: user[0].email,
            name: user[0].name,
            metadata: { userId },
          });
          stripeCustomerId = customer.id;

          // Attach payment method to customer
          await stripe.paymentMethods.attach(stripePaymentMethodId, {
            customer: customer.id,
          });
        } catch (error) {
          console.error("Stripe customer creation error:", error);
          // Continue without Stripe integration if it fails
        }
      }

      const newMethod = await db.insert(paymentMethods).values({
        id: randomUUID(),
        userId,
        type: type || 'card',
        provider: provider || 'stripe',
        last4,
        expiryMonth,
        expiryYear,
        isDefault: 0, // Will be set to default if it's the first method
      }).returning();

      // If this is the first payment method, make it default
      const existingMethods = await db.select().from(paymentMethods).where(eq(paymentMethods.userId, userId));
      if (existingMethods.length === 1) {
        await db.update(paymentMethods).set({ isDefault: 1 }).where(eq(paymentMethods.id, newMethod[0].id));
      }

      res.json(newMethod[0]);
    } catch (error) {
      console.error("Create payment method error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/payment-methods/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { last4, expiryMonth, expiryYear } = req.body;
      const userId = req.user!.userId;

      const method = await db.select()
        .from(paymentMethods)
        .where(and(eq(paymentMethods.id, id), eq(paymentMethods.userId, userId)))
        .limit(1);

      if (method.length === 0) {
        return res.status(404).json({ error: "Payment method not found" });
      }

      const updateData: any = {};
      if (last4 !== undefined) updateData.last4 = last4;
      if (expiryMonth !== undefined) updateData.expiryMonth = expiryMonth;
      if (expiryYear !== undefined) updateData.expiryYear = expiryYear;

      const updatedMethod = await db.update(paymentMethods)
        .set(updateData)
        .where(eq(paymentMethods.id, id))
        .returning();

      res.json(updatedMethod[0]);
    } catch (error) {
      console.error("Update payment method error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/payment-methods/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const method = await db.select()
        .from(paymentMethods)
        .where(and(eq(paymentMethods.id, id), eq(paymentMethods.userId, userId)))
        .limit(1);

      if (method.length === 0) {
        return res.status(404).json({ error: "Payment method not found" });
      }

      await db.delete(paymentMethods).where(eq(paymentMethods.id, id));

      // If this was the default method, make another one default
      if (method[0].isDefault) {
        const remainingMethods = await db.select()
          .from(paymentMethods)
          .where(eq(paymentMethods.userId, userId))
          .orderBy(paymentMethods.createdAt)
          .limit(1);

        if (remainingMethods.length > 0) {
          await db.update(paymentMethods)
            .set({ isDefault: 1 })
            .where(eq(paymentMethods.id, remainingMethods[0].id));
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Delete payment method error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/payment-methods/:id/default", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const method = await db.select()
        .from(paymentMethods)
        .where(and(eq(paymentMethods.id, id), eq(paymentMethods.userId, userId)))
        .limit(1);

      if (method.length === 0) {
        return res.status(404).json({ error: "Payment method not found" });
      }

      // Remove default from all methods for this user
      await db.update(paymentMethods).set({ isDefault: 0 }).where(eq(paymentMethods.userId, userId));

      // Set this method as default
      await db.update(paymentMethods).set({ isDefault: 1 }).where(eq(paymentMethods.id, id));

      res.json({ success: true });
    } catch (error) {
      console.error("Set default payment method error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Subscription routes
  app.get("/api/subscription-plans", async (req, res) => {
    try {
      const plans = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isActive, 1));
      res.json(plans);
    } catch (error) {
      console.error("Get subscription plans error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/subscription", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.userId;

      // Get user's active subscription
      const subscription = await db.select({
        id: userSubscriptions.id,
        planId: userSubscriptions.planId,
        status: userSubscriptions.status,
        startDate: userSubscriptions.startDate,
        endDate: userSubscriptions.endDate,
        autoRenew: userSubscriptions.autoRenew,
        createdAt: userSubscriptions.createdAt,
        updatedAt: userSubscriptions.updatedAt,
        plan: {
          id: subscriptionPlans.id,
          name: subscriptionPlans.name,
          description: subscriptionPlans.description,
          price: subscriptionPlans.price,
          currency: subscriptionPlans.currency,
          duration: subscriptionPlans.duration,
          features: subscriptionPlans.features,
        }
      })
      .from(userSubscriptions)
      .leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
      .where(and(
        eq(userSubscriptions.userId, userId),
        eq(userSubscriptions.status, 'active')
      ))
      .orderBy(userSubscriptions.createdAt)
      .limit(1);

      if (subscription.length === 0) {
        return res.json({ subscription: null, isActive: false });
      }

      const sub = subscription[0];
      const now = Math.floor(Date.now() / 1000);
      const isActive = sub.status === 'active' && sub.endDate > now;

      res.json({
        subscription: sub,
        isActive,
        daysRemaining: Math.max(0, Math.ceil((sub.endDate - now) / (24 * 60 * 60))),
        features: sub.plan?.features ? JSON.parse(sub.plan.features) : []
      });
    } catch (error) {
      console.error("Get subscription error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/subscription", authenticateToken, async (req, res) => {
    try {
      const { planId } = req.body;
      const userId = req.user!.userId;

      // Check if plan exists
      const plan = await db.select().from(subscriptionPlans).where(and(eq(subscriptionPlans.id, planId), eq(subscriptionPlans.isActive, 1))).limit(1);
      if (plan.length === 0) {
        return res.status(404).json({ error: "Subscription plan not found" });
      }

      // Check if user already has an active subscription
      const existingSub = await db.select().from(userSubscriptions).where(and(
        eq(userSubscriptions.userId, userId),
        eq(userSubscriptions.status, 'active')
      )).limit(1);

      if (existingSub.length > 0) {
        return res.status(400).json({ error: "User already has an active subscription" });
      }

      const now = Math.floor(Date.now() / 1000);
      const endDate = now + (plan[0].duration * 24 * 60 * 60); // Convert days to seconds

      const newSubscription = await db.insert(userSubscriptions).values({
        id: randomUUID(),
        userId,
        planId,
        status: 'active',
        startDate: now,
        endDate,
        autoRenew: 1,
      }).returning();

      res.json(newSubscription[0]);
    } catch (error) {
      console.error("Create subscription error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/subscription/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { status, autoRenew } = req.body;
      const userId = req.user!.userId;

      // Check if subscription belongs to user
      const subscription = await db.select().from(userSubscriptions).where(eq(userSubscriptions.id, id)).limit(1);
      if (subscription.length === 0 || subscription[0].userId !== userId) {
        return res.status(404).json({ error: "Subscription not found" });
      }

      const updateData: any = { updatedAt: Math.floor(Date.now() / 1000) };
      if (status !== undefined) updateData.status = status;
      if (autoRenew !== undefined) updateData.autoRenew = autoRenew ? 1 : 0;

      const updatedSubscription = await db.update(userSubscriptions)
        .set(updateData)
        .where(eq(userSubscriptions.id, id))
        .returning();

      res.json(updatedSubscription[0]);
    } catch (error) {
      console.error("Update subscription error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/subscription/:id/cancel", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { cancelAtPeriodEnd = false, reason } = req.body;
      const userId = req.user!.userId;

      // Check if subscription belongs to user
      const subscription = await db.select().from(userSubscriptions).where(eq(userSubscriptions.id, id)).limit(1);
      if (subscription.length === 0 || subscription[0].userId !== userId) {
        return res.status(404).json({ error: "Subscription not found" });
      }

      if (cancelAtPeriodEnd) {
        // Cancel at end of billing period
        await db.update(userSubscriptions).set({
          autoRenew: 0,
          updatedAt: Math.floor(Date.now() / 1000)
        }).where(eq(userSubscriptions.id, id));
      } else {
        // Cancel immediately
        await db.update(userSubscriptions).set({
          status: 'cancelled',
          autoRenew: 0,
          updatedAt: Math.floor(Date.now() / 1000)
        }).where(eq(userSubscriptions.id, id));
      }

      res.json({ success: true, cancelAtPeriodEnd });
    } catch (error) {
      console.error("Cancel subscription error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/subscription/:id/renew", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      // Check if subscription belongs to user
      const subscription = await db.select()
        .from(userSubscriptions)
        .where(and(eq(userSubscriptions.id, id), eq(userSubscriptions.userId, userId)))
        .limit(1);

      if (subscription.length === 0) {
        return res.status(404).json({ error: "Subscription not found" });
      }

      const sub = subscription[0];
      if (sub.status !== 'expired' && sub.status !== 'cancelled') {
        return res.status(400).json({ error: "Subscription is not expired or cancelled" });
      }

      // Get the plan details
      if (!sub.planId) {
        return res.status(400).json({ error: "Subscription has no plan" });
      }
      const plan = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, sub.planId)).limit(1);
      if (plan.length === 0) {
        return res.status(404).json({ error: "Subscription plan not found" });
      }

      const now = Math.floor(Date.now() / 1000);
      const endDate = now + (plan[0].duration * 24 * 60 * 60); // Convert days to seconds

      // Renew the subscription
      await db.update(userSubscriptions).set({
        status: 'active',
        startDate: now,
        endDate,
        autoRenew: 1,
        updatedAt: now
      }).where(eq(userSubscriptions.id, id));

      res.json({ success: true, endDate });
    } catch (error) {
      console.error("Renew subscription error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/subscription/:id/change-plan", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { newPlanId } = req.body;
      const userId = req.user!.userId;

      // Check if subscription belongs to user
      const subscription = await db.select()
        .from(userSubscriptions)
        .where(and(eq(userSubscriptions.id, id), eq(userSubscriptions.userId, userId)))
        .limit(1);

      if (subscription.length === 0) {
        return res.status(404).json({ error: "Subscription not found" });
      }

      // Check if new plan exists
      const newPlan = await db.select().from(subscriptionPlans).where(and(
        eq(subscriptionPlans.id, newPlanId!),
        eq(subscriptionPlans.isActive, 1)
      )).limit(1);

      if (newPlan.length === 0) {
        return res.status(404).json({ error: "New subscription plan not found" });
      }

      const now = Math.floor(Date.now() / 1000);
      const newEndDate = now + (newPlan[0].duration * 24 * 60 * 60);

      // Update subscription with new plan
      await db.update(userSubscriptions).set({
        planId: newPlanId,
        startDate: now,
        endDate: newEndDate,
        updatedAt: now
      }).where(eq(userSubscriptions.id, id));

      res.json({
        success: true,
        newPlan: newPlan[0],
        endDate: newEndDate
      });
    } catch (error) {
      console.error("Change subscription plan error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get subscription history for user
  app.get("/api/subscription/history", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.userId;
      const { limit = '10', offset = '0' } = req.query;
      const limitNum = parseInt(limit as string, 10);
      const offsetNum = parseInt(offset as string, 10);

      const subscriptions = await db.select({
        id: userSubscriptions.id,
        planId: userSubscriptions.planId,
        status: userSubscriptions.status,
        startDate: userSubscriptions.startDate,
        endDate: userSubscriptions.endDate,
        autoRenew: userSubscriptions.autoRenew,
        createdAt: userSubscriptions.createdAt,
        updatedAt: userSubscriptions.updatedAt,
        plan: {
          name: subscriptionPlans.name,
          price: subscriptionPlans.price,
          currency: subscriptionPlans.currency,
          duration: subscriptionPlans.duration,
        }
      })
      .from(userSubscriptions)
      .leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
      .where(eq(userSubscriptions.userId, userId))
      .orderBy(userSubscriptions.createdAt)
      .limit(limitNum)
      .offset(offsetNum);

      res.json(subscriptions);
    } catch (error) {
      console.error("Get subscription history error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return { server: httpServer || createServer(app), processPaymentRetries };
}
