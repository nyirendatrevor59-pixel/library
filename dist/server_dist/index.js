var __defProp = Object.defineProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express from "express";

// server/routes.ts
import { createServer } from "node:http";

// server/storage.ts
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  chatMessages: () => chatMessages,
  courses: () => courses,
  deletedMaterials: () => deletedMaterials,
  insertChatMessageSchema: () => insertChatMessageSchema,
  insertCourseSchema: () => insertCourseSchema,
  insertDeletedMaterialSchema: () => insertDeletedMaterialSchema,
  insertLecturerMaterialSchema: () => insertLecturerMaterialSchema,
  insertLiveSessionSchema: () => insertLiveSessionSchema,
  insertMobilePaymentProviderSchema: () => insertMobilePaymentProviderSchema,
  insertOtpVerificationSchema: () => insertOtpVerificationSchema,
  insertPaymentMethodSchema: () => insertPaymentMethodSchema,
  insertPaymentSchema: () => insertPaymentSchema,
  insertSharedDocumentSchema: () => insertSharedDocumentSchema,
  insertSubscriptionPlanSchema: () => insertSubscriptionPlanSchema,
  insertSupportRequestSchema: () => insertSupportRequestSchema,
  insertTutorRequestSchema: () => insertTutorRequestSchema,
  insertUserAnalyticsSchema: () => insertUserAnalyticsSchema,
  insertUserSchema: () => insertUserSchema,
  insertUserSubscriptionSchema: () => insertUserSubscriptionSchema,
  insertUserTutorSchema: () => insertUserTutorSchema,
  lecturerMaterials: () => lecturerMaterials,
  liveSessions: () => liveSessions,
  mobilePaymentProviders: () => mobilePaymentProviders,
  notifications: () => notifications,
  otpVerifications: () => otpVerifications,
  paymentMethods: () => paymentMethods,
  payments: () => payments,
  sharedDocuments: () => sharedDocuments,
  subscriptionPlans: () => subscriptionPlans,
  supportRequests: () => supportRequests,
  tutorRequests: () => tutorRequests,
  userAnalytics: () => userAnalytics,
  userSubscriptions: () => userSubscriptions,
  userTutors: () => userTutors,
  users: () => users
});
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { z } from "zod";
var users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("student"),
  // student, lecturer, tutor, admin
  name: text("name").notNull(),
  selectedCourses: text("selectedCourses").default("[]"),
  // JSON string
  createdAt: integer("createdAt").default(sql`(unixepoch())`)
});
var courses = sqliteTable("courses", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  category: text("category").notNull(),
  description: text("description"),
  lecturerId: text("lecturerId").references(() => users.id),
  lecturerName: text("lecturerName"),
  createdAt: integer("createdAt").default(sql`(unixepoch())`)
});
var liveSessions = sqliteTable("live_sessions", {
  id: text("id").primaryKey(),
  courseId: text("courseId").references(() => courses.id),
  lecturerId: text("lecturerId").references(() => users.id),
  lecturerName: text("lecturerName"),
  topic: text("topic").notNull(),
  scheduledTime: integer("scheduledTime"),
  startTime: integer("startTime"),
  endTime: integer("endTime"),
  isLive: integer("isLive").default(0),
  participants: integer("participants").default(0),
  settings: text("settings"),
  // JSON string
  currentDocument: text("currentDocument"),
  // JSON string: { id, title, url }
  currentPage: integer("currentPage").default(1),
  annotations: text("annotations"),
  // JSON string
  currentTool: text("currentTool").default("draw"),
  createdAt: integer("createdAt").default(sql`(unixepoch())`)
});
var chatMessages = sqliteTable("chat_messages", {
  id: text("id").primaryKey(),
  sessionId: text("sessionId").references(() => liveSessions.id),
  userId: text("userId").references(() => users.id),
  message: text("message").notNull(),
  timestamp: integer("timestamp").default(sql`(unixepoch())`)
});
var sharedDocuments = sqliteTable("shared_documents", {
  id: text("id").primaryKey(),
  sessionId: text("sessionId").references(() => liveSessions.id),
  userId: text("userId").references(() => users.id),
  title: text("title").notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileType: text("fileType").notNull(),
  // pdf, doc, docx
  annotations: text("annotations"),
  // JSON string
  sharedAt: integer("sharedAt").default(sql`(unixepoch())`)
});
var lecturerMaterials = sqliteTable("lecturer_materials", {
  id: text("id").primaryKey(),
  lecturerId: text("lecturerId").references(() => users.id),
  courseId: text("courseId").references(() => courses.id),
  title: text("title").notNull(),
  description: text("description"),
  fileUrl: text("fileUrl"),
  fileType: text("fileType"),
  // pdf, doc, docx, link
  content: text("content"),
  // For text content or link
  size: integer("size"),
  // File size in bytes
  createdAt: integer("createdAt").default(sql`(unixepoch())`),
  isDeleted: integer("isDeleted").default(0)
});
var tutorRequests = sqliteTable("tutor_requests", {
  id: text("id").primaryKey(),
  studentId: text("studentId").references(() => users.id),
  courseId: text("courseId").references(() => courses.id),
  type: text("type").notNull(),
  // topic_help, question, assignment_help
  title: text("title").notNull(),
  description: text("description"),
  messages: text("messages"),
  // JSON string for conversation history
  response: text("response"),
  // Tutor's response to the request
  status: text("status").default("pending"),
  // pending, answered, resolved
  createdAt: integer("createdAt").default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt").default(sql`(unixepoch())`)
});
var deletedMaterials = sqliteTable("deleted_materials", {
  id: text("id").primaryKey(),
  originalId: text("originalId").notNull(),
  lecturerId: text("lecturerId").references(() => users.id),
  courseId: text("courseId").references(() => courses.id),
  title: text("title").notNull(),
  description: text("description"),
  fileUrl: text("fileUrl"),
  fileType: text("fileType"),
  // pdf, doc, docx, link
  content: text("content"),
  // For text content or link
  size: integer("size"),
  // File size in bytes
  createdAt: integer("createdAt").default(sql`(unixepoch())`),
  deletedAt: integer("deletedAt").default(sql`(unixepoch())`)
});
var supportRequests = sqliteTable("support_requests", {
  id: text("id").primaryKey(),
  userId: text("userId").references(() => users.id),
  type: text("type").notNull(),
  // password_reset, account_issue, technical_problem, other
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("open"),
  // open, in_progress, resolved, closed
  assignedTo: text("assignedTo").references(() => users.id),
  // admin/tutor handling it
  createdAt: integer("createdAt").default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt").default(sql`(unixepoch())`)
});
var userAnalytics = sqliteTable("user_analytics", {
  id: text("id").primaryKey(),
  userId: text("userId").references(() => users.id),
  metric: text("metric").notNull(),
  // sessions_attended, documents_viewed, messages_sent, etc.
  value: integer("value").notNull(),
  date: integer("date").default(sql`(unixepoch())`)
  // unix timestamp
});
var userTutors = sqliteTable("user_tutors", {
  id: text("id").primaryKey(),
  studentId: text("studentId").references(() => users.id),
  tutorId: text("tutorId").references(() => users.id),
  courseId: text("courseId").references(() => courses.id),
  assignedBy: text("assignedBy").references(() => users.id),
  // who assigned
  assignedAt: integer("assignedAt").default(sql`(unixepoch())`),
  status: text("status").default("active")
  // active, inactive
});
var subscriptionPlans = sqliteTable("subscription_plans", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(),
  // Price in cents
  currency: text("currency").notNull().default("USD"),
  duration: integer("duration").notNull(),
  // Duration in days
  features: text("features"),
  // JSON string
  isActive: integer("isActive").default(1),
  createdAt: integer("createdAt").default(sql`(unixepoch())`)
});
var userSubscriptions = sqliteTable("user_subscriptions", {
  id: text("id").primaryKey(),
  userId: text("userId").references(() => users.id),
  planId: text("planId").references(() => subscriptionPlans.id),
  status: text("status").notNull().default("active"),
  // active, cancelled, expired, paused
  startDate: integer("startDate").notNull(),
  endDate: integer("endDate").notNull(),
  autoRenew: integer("autoRenew").default(1),
  // boolean
  createdAt: integer("createdAt").default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt").default(sql`(unixepoch())`)
});
var payments = sqliteTable("payments", {
  id: text("id").primaryKey(),
  userId: text("userId").references(() => users.id),
  subscriptionId: text("subscriptionId").references(() => userSubscriptions.id),
  // nullable
  amount: integer("amount").notNull(),
  // Amount in cents
  currency: text("currency").notNull().default("USD"),
  status: text("status").notNull().default("pending"),
  // pending, processing, completed, failed, refunded, retrying, otp_required
  paymentMethod: text("paymentMethod").notNull(),
  // card, mpesa, airtel, paypal, etc.
  transactionId: text("transactionId"),
  // External payment provider ID
  description: text("description"),
  retryCount: integer("retryCount").default(0),
  nextRetryAt: integer("nextRetryAt"),
  maxRetries: integer("maxRetries").default(5),
  // Mobile payment specific fields
  mobileProvider: text("mobileProvider"),
  // mpesa, airtel, etc.
  mobileNumber: text("mobileNumber"),
  // Phone number for mobile payments
  otpRequired: integer("otpRequired").default(0),
  // Boolean flag for OTP requirement
  otpVerified: integer("otpVerified").default(0),
  // Boolean flag for OTP verification status
  otpId: text("otpId"),
  // OTP verification ID from provider
  otpExpiresAt: integer("otpExpiresAt"),
  // OTP expiration timestamp
  createdAt: integer("createdAt").default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt").default(sql`(unixepoch())`)
});
var paymentMethods = sqliteTable("payment_methods", {
  id: text("id").primaryKey(),
  userId: text("userId").references(() => users.id),
  type: text("type").notNull(),
  // card, paypal, bank_transfer
  provider: text("provider").notNull(),
  // stripe, paypal, etc.
  last4: text("last4"),
  // Last 4 digits for cards
  expiryMonth: integer("expiryMonth"),
  expiryYear: integer("expiryYear"),
  isDefault: integer("isDefault").default(0),
  // boolean
  createdAt: integer("createdAt").default(sql`(unixepoch())`)
});
var notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("userId").references(() => users.id),
  type: text("type").notNull(),
  // payment_failed, payment_retry, payment_success, otp_sent
  title: text("title").notNull(),
  message: text("message").notNull(),
  data: text("data"),
  // JSON string for additional data
  isRead: integer("isRead").default(0),
  createdAt: integer("createdAt").default(sql`(unixepoch())`)
});
var otpVerifications = sqliteTable("otp_verifications", {
  id: text("id").primaryKey(),
  paymentId: text("paymentId").references(() => payments.id),
  otpCode: text("otpCode").notNull(),
  // Hashed OTP code
  phoneNumber: text("phoneNumber").notNull(),
  provider: text("provider").notNull(),
  // mpesa, airtel, etc.
  status: text("status").notNull().default("pending"),
  // pending, verified, expired, failed
  attempts: integer("attempts").default(0),
  maxAttempts: integer("maxAttempts").default(3),
  expiresAt: integer("expiresAt").notNull(),
  verifiedAt: integer("verifiedAt"),
  createdAt: integer("createdAt").default(sql`(unixepoch())`)
});
var mobilePaymentProviders = sqliteTable("mobile_payment_providers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  // mpesa, airtel, zamtel, etc.
  displayName: text("displayName").notNull(),
  country: text("country").notNull(),
  // ZM, KE, TZ, etc.
  currency: text("currency").notNull(),
  // ZMW, KES, TZS, etc.
  minAmount: integer("minAmount").notNull(),
  // Minimum amount in cents
  maxAmount: integer("maxAmount").notNull(),
  // Maximum amount in cents
  isActive: integer("isActive").default(1),
  apiEndpoint: text("apiEndpoint"),
  // For production API
  apiKey: text("apiKey"),
  // Encrypted API key
  apiSecret: text("apiSecret"),
  // Encrypted API secret
  webhookUrl: text("webhookUrl"),
  createdAt: integer("createdAt").default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt").default(sql`(unixepoch())`)
});
var insertUserSchema = z.object({
  username: z.string(),
  email: z.string(),
  password: z.string(),
  role: z.string().optional().default("student"),
  name: z.string()
});
var insertCourseSchema = z.object({
  name: z.string(),
  code: z.string(),
  category: z.string(),
  description: z.string().optional(),
  lecturerId: z.string().optional()
});
var insertLiveSessionSchema = z.object({
  courseId: z.string(),
  lecturerId: z.string(),
  topic: z.string(),
  scheduledTime: z.number().optional()
});
var insertChatMessageSchema = z.object({
  sessionId: z.string(),
  userId: z.string(),
  message: z.string()
});
var insertSharedDocumentSchema = z.object({
  sessionId: z.string(),
  userId: z.string(),
  title: z.string(),
  fileUrl: z.string(),
  fileType: z.string()
});
var insertLecturerMaterialSchema = z.object({
  lecturerId: z.string(),
  courseId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  fileUrl: z.string().optional(),
  fileType: z.string().optional(),
  content: z.string().optional(),
  size: z.number().optional()
});
var insertTutorRequestSchema = z.object({
  studentId: z.string(),
  courseId: z.string(),
  type: z.string(),
  title: z.string(),
  description: z.string().optional(),
  messages: z.string().optional()
});
var insertDeletedMaterialSchema = z.object({
  originalId: z.string(),
  lecturerId: z.string(),
  courseId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  fileUrl: z.string().optional(),
  fileType: z.string().optional(),
  content: z.string().optional(),
  size: z.number().optional()
});
var insertSupportRequestSchema = z.object({
  userId: z.string(),
  type: z.string(),
  title: z.string(),
  description: z.string().optional()
});
var insertUserAnalyticsSchema = z.object({
  userId: z.string(),
  metric: z.string(),
  value: z.number(),
  date: z.number().optional()
});
var insertUserTutorSchema = z.object({
  studentId: z.string(),
  tutorId: z.string(),
  courseId: z.string(),
  assignedBy: z.string()
});
var insertSubscriptionPlanSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  price: z.number(),
  currency: z.string().optional().default("USD"),
  duration: z.number(),
  features: z.string().optional(),
  isActive: z.number().optional().default(1)
});
var insertUserSubscriptionSchema = z.object({
  userId: z.string(),
  planId: z.string(),
  status: z.string().optional().default("active"),
  startDate: z.number(),
  endDate: z.number(),
  autoRenew: z.number().optional().default(1)
});
var insertPaymentSchema = z.object({
  userId: z.string(),
  subscriptionId: z.string().optional(),
  amount: z.number(),
  currency: z.string().optional().default("USD"),
  status: z.string().optional().default("pending"),
  paymentMethod: z.string(),
  transactionId: z.string().optional(),
  description: z.string().optional()
});
var insertPaymentMethodSchema = z.object({
  userId: z.string(),
  type: z.string(),
  provider: z.string(),
  last4: z.string().optional(),
  expiryMonth: z.number().optional(),
  expiryYear: z.number().optional(),
  isDefault: z.number().optional().default(0)
});
var insertOtpVerificationSchema = z.object({
  paymentId: z.string().optional(),
  otpCode: z.string(),
  phoneNumber: z.string(),
  provider: z.string(),
  status: z.string().optional().default("pending"),
  attempts: z.number().optional().default(0),
  maxAttempts: z.number().optional().default(3),
  expiresAt: z.number(),
  verifiedAt: z.number().optional()
});
var insertMobilePaymentProviderSchema = z.object({
  name: z.string(),
  displayName: z.string(),
  country: z.string(),
  currency: z.string(),
  minAmount: z.number(),
  maxAmount: z.number(),
  isActive: z.number().optional().default(1),
  apiEndpoint: z.string().optional(),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  webhookUrl: z.string().optional()
});

// server/storage.ts
var sqlite = new Database("database.db");
sqlite.pragma("foreign_keys = ON");
var db = drizzle(sqlite, { schema: schema_exports });

// server/routes.ts
import { eq, and, inArray, or, ne, sql as sql2, gte, lte } from "drizzle-orm";
import jwt from "jsonwebtoken";
import multer from "multer";
import { randomUUID } from "crypto";
import Stripe from "stripe";
var materialsCache = /* @__PURE__ */ new Map();
var CACHE_TTL = 5 * 60 * 1e3;
var SAMPLE_COURSES = [
  {
    id: "1",
    name: "Introduction to Computer Science",
    code: "CS101",
    category: "Computer Science",
    description: "Fundamentals of programming and algorithms",
    lecturerName: "Dr. Sarah Johnson"
  },
  {
    id: "2",
    name: "Data Structures and Algorithms",
    code: "CS201",
    category: "Computer Science",
    description: "Advanced data structures and algorithm design",
    lecturerName: "Prof. Michael Chen"
  },
  {
    id: "3",
    name: "Calculus I",
    code: "MATH101",
    category: "Mathematics",
    description: "Differential and integral calculus",
    lecturerName: "Dr. Emily Watson"
  },
  {
    id: "4",
    name: "Linear Algebra",
    code: "MATH201",
    category: "Mathematics",
    description: "Vector spaces and linear transformations",
    lecturerName: "Prof. David Lee"
  },
  {
    id: "5",
    name: "Physics I",
    code: "PHY101",
    category: "Physics",
    description: "Classical mechanics and thermodynamics",
    lecturerName: "Dr. Robert Miller"
  },
  {
    id: "6",
    name: "Organic Chemistry",
    code: "CHEM201",
    category: "Chemistry",
    description: "Structure and reactions of organic compounds",
    lecturerName: "Dr. Lisa Anderson"
  },
  {
    id: "7",
    name: "Business Management",
    code: "BUS101",
    category: "Business",
    description: "Principles of business and management",
    lecturerName: "Prof. James Wilson"
  },
  {
    id: "8",
    name: "English Literature",
    code: "ENG201",
    category: "Literature",
    description: "Classic and modern English literature",
    lecturerName: "Dr. Amanda Brown"
  }
];
async function seedCourses() {
  try {
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
          lecturerName: course.lecturerName
        });
      } else {
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
        selectedCourses: '["1"]'
      },
      {
        id: "lecturer-1",
        username: "lecturer",
        email: "lecturer@test.com",
        password: "password",
        name: "Test Lecturer",
        role: "lecturer"
      },
      {
        id: "tutor-1",
        username: "tutor",
        email: "tutor@test.com",
        password: "password",
        name: "Test Tutor",
        role: "tutor"
      },
      {
        id: "admin-1",
        username: "admin",
        email: "admin@test.com",
        password: "password",
        name: "Test Admin",
        role: "admin"
      }
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
          selectedCourses: "[]"
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
        content: Buffer.from("Sample PDF content").toString("base64")
        // Dummy content
      },
      {
        lecturerId,
        courseId: "1",
        title: "Data Structures Notes",
        description: "Notes on arrays and linked lists",
        fileUrl: null,
        fileType: "text/plain",
        content: Buffer.from("Sample PDF content 2").toString("base64")
      }
    ];
    for (const material of testMaterials) {
      const existing = await db.select().from(lecturerMaterials).where(eq(lecturerMaterials.title, material.title)).limit(1);
      if (existing.length === 0) {
        const newMaterial = await db.insert(lecturerMaterials).values({
          id: randomUUID(),
          ...material
        }).returning();
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
        courseId: "1",
        // Assuming course 1
        assignedBy
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
    await db.insert(tutorRequests).values({
      id: randomUUID(),
      studentId,
      courseId: "1",
      type: "question",
      title: "Sample Question",
      description: "This is a sample tutor request for testing."
    });
    console.log("Tutor request seeded");
  } catch (error) {
    console.error("Error seeding tutor requests:", error);
  }
}
async function seedLiveSessions() {
  try {
    const lecturerUser = await db.select().from(users).where(eq(users.role, "lecturer")).limit(1);
    const lecturerId = lecturerUser.length > 0 ? lecturerUser[0].id : null;
    if (!lecturerId) {
      console.log("No lecturer user found, skipping live session seeding");
      return;
    }
    const testSession = {
      id: "test-live",
      courseId: "1",
      lecturerId,
      topic: "Test Live Class",
      scheduledTime: null,
      startTime: Math.floor(Date.now() / 1e3),
      isLive: 1,
      participants: 5
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
        price: 999,
        // $9.99 in cents
        currency: "USD",
        duration: 30,
        // 30 days
        features: JSON.stringify(["unlimited_chat", "tutor_support", "materials_access"]),
        isActive: 1
      },
      {
        id: "premium-plan",
        name: "Premium Plan",
        description: "Full access to all features",
        price: 1999,
        // $19.99 in cents
        currency: "USD",
        duration: 30,
        // 30 days
        features: JSON.stringify(["unlimited_chat", "tutor_support", "materials_access", "live_sessions", "priority_support"]),
        isActive: 1
      },
      {
        id: "yearly-plan",
        name: "Yearly Plan",
        description: "Premium features for a year",
        price: 19999,
        // $199.99 in cents
        currency: "USD",
        duration: 365,
        // 365 days
        features: JSON.stringify(["unlimited_chat", "tutor_support", "materials_access", "live_sessions", "priority_support", "advanced_analytics"]),
        isActive: 1
      }
    ];
    for (const plan of plans) {
      const existing = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, plan.id)).limit(1);
      if (existing.length === 0) {
        await db.insert(subscriptionPlans).values(plan);
      }
    }
    const studentUser = await db.select().from(users).where(eq(users.role, "student")).limit(1);
    if (studentUser.length > 0) {
      const studentId = studentUser[0].id;
      const existingSub = await db.select().from(userSubscriptions).where(eq(userSubscriptions.userId, studentId)).limit(1);
      if (existingSub.length === 0) {
        const now = Math.floor(Date.now() / 1e3);
        const endDate = now + 30 * 24 * 60 * 60;
        await db.insert(userSubscriptions).values({
          id: randomUUID(),
          userId: studentId,
          planId: "premium-plan",
          status: "active",
          startDate: now,
          endDate,
          autoRenew: 1
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
    const allUsers = await db.select().from(users);
    const analyticsData = [
      { userId: allUsers.find((u) => u.role === "student")?.id, metric: "sessions_attended", value: 3 },
      { userId: allUsers.find((u) => u.role === "student")?.id, metric: "documents_viewed", value: 5 },
      { userId: allUsers.find((u) => u.role === "student")?.id, metric: "messages_sent", value: 2 },
      { userId: allUsers.find((u) => u.role === "lecturer")?.id, metric: "materials_uploaded", value: 2 }
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
            date: Math.floor(Date.now() / 1e3)
          });
        }
      }
    }
    console.log("Analytics seeded");
  } catch (error) {
    console.error("Error seeding analytics:", error);
  }
}
var fs = __require("fs");
var path = __require("path");
var materialsFile = path.join(__dirname, "uploadedMaterials.json");
var storage = multer.memoryStorage();
var upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
      "image/gif"
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  }
});
var uploadedMaterials = [];
function loadMaterials() {
  try {
    if (fs.existsSync(materialsFile)) {
      const data = fs.readFileSync(materialsFile, "utf8");
      uploadedMaterials = JSON.parse(data);
    }
  } catch (error) {
    console.error("Error loading materials:", error);
    uploadedMaterials = [];
  }
}
loadMaterials();
var JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
async function createNotification(userId, type, title, message, data) {
  try {
    await db.insert(notifications).values({
      id: randomUUID(),
      userId,
      type,
      title,
      message,
      data: data ? JSON.stringify(data) : null
    });
  } catch (error) {
    console.error("Error creating notification:", error);
  }
}
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
}
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    console.log("requireRole: checking userId", req.user.userId, "for roles", role);
    db.select().from(users).where(eq(users.id, req.user.userId)).limit(1).then((userResult) => {
      if (userResult.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      const user = userResult[0];
      const roles = Array.isArray(role) ? role : [role];
      if (!roles.includes(user.role)) {
        return res.status(403).json({ error: `Access denied. One of ${roles.join(", ")} roles required.` });
      }
      req.userDetails = user;
      next();
    }).catch((error) => {
      console.error("Error checking user role:", error);
      res.status(500).json({ error: "Internal server error" });
    });
  };
}
async function registerRoutes(app2, httpServer, io) {
  let stripe = null;
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-12-15.clover"
    });
  }
  async function handlePaymentFailure(transactionId) {
    try {
      const payment = await db.select().from(payments).where(eq(payments.transactionId, transactionId)).limit(1);
      if (payment.length === 0) {
        console.error("Payment not found for transaction:", transactionId);
        return;
      }
      const p = payment[0];
      if (!p.userId) {
        console.error("Payment has no userId:", p.id);
        return;
      }
      const now = Math.floor(Date.now() / 1e3);
      if (p.status === "retrying") return;
      const newRetryCount = (p.retryCount || 0) + 1;
      const maxRetries = p.maxRetries || 5;
      if (newRetryCount > maxRetries) {
        await db.update(payments).set({
          status: "failed",
          updatedAt: now
        }).where(eq(payments.id, p.id));
        await createNotification(p.userId, "payment_failed", "Payment Failed", `Your payment of ${(p.amount / 100).toFixed(2)} has failed after ${maxRetries} attempts.`, { paymentId: p.id });
        const admins = await db.select().from(users).where(eq(users.role, "admin"));
        for (const admin of admins) {
          await createNotification(admin.id, "payment_failed", "Payment Failed", `Payment ${p.id} for user ${p.userId} has failed after ${maxRetries} attempts.`, { paymentId: p.id, userId: p.userId });
        }
        return;
      }
      const delayMinutes = Math.pow(2, newRetryCount - 1);
      const nextRetryAt = now + delayMinutes * 60;
      await db.update(payments).set({
        status: "retrying",
        retryCount: newRetryCount,
        nextRetryAt,
        updatedAt: now
      }).where(eq(payments.id, p.id));
      await createNotification(p.userId, "payment_retry", "Payment Retry Scheduled", `Your payment of ${(p.amount / 100).toFixed(2)} failed. We'll retry in ${delayMinutes} minute(s).`, { paymentId: p.id, retryAttempt: newRetryCount });
      console.log(`Payment ${p.id} scheduled for retry ${newRetryCount}/${maxRetries} at ${new Date(nextRetryAt * 1e3).toISOString()}`);
    } catch (error) {
      console.error("Error handling payment failure:", error);
    }
  }
  async function processPaymentRetries() {
    try {
      const now = Math.floor(Date.now() / 1e3);
      const retryPayments = await db.select().from(payments).where(
        and(
          eq(payments.status, "retrying"),
          lte(payments.nextRetryAt, now)
        )
      );
      for (const payment of retryPayments) {
        await retryPayment(payment);
      }
    } catch (error) {
      console.error("Error processing payment retries:", error);
    }
  }
  async function retryPayment(payment) {
    try {
      if (!stripe) {
        console.error("Stripe not configured for payment retry");
        return;
      }
      const now = Math.floor(Date.now() / 1e3);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: payment.amount,
        currency: payment.currency.toLowerCase(),
        description: payment.description,
        metadata: {
          userId: payment.userId,
          subscriptionId: payment.subscriptionId || "",
          retryAttempt: payment.retryCount
        }
      });
      await db.update(payments).set({
        transactionId: paymentIntent.id,
        status: "pending",
        updatedAt: now
      }).where(eq(payments.id, payment.id));
      console.log(`Payment ${payment.id} retry initiated with new transaction ${paymentIntent.id}`);
    } catch (error) {
      console.error(`Error retrying payment ${payment.id}:`, error);
      await handlePaymentFailure(payment.transactionId);
    }
  }
  await seedUsers();
  await seedTutorAssignments();
  await seedTutorRequests();
  await seedCourses();
  await seedMaterials();
  await seedLiveSessions();
  await seedSubscriptionPlans();
  await seedAnalytics();
  app2.post("/api/auth/login", async (req, res) => {
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
          selectedCourses: JSON.parse(user.selectedCourses || "[]"),
          username: user.username,
          createdAt: user.createdAt
        },
        token
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/auth/register", async (req, res) => {
    try {
      const { username, email, password, name, role } = req.body;
      const existingUser = await db.select().from(users).where(
        eq(users.email, email)
      ).limit(1);
      if (existingUser.length > 0) {
        return res.status(400).json({ error: "User already exists" });
      }
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
        selectedCourses: requestedRole === "student" ? '["1"]' : "[]"
      }).returning();
      const token = jwt.sign({ userId: newUser[0].id }, JWT_SECRET, { expiresIn: "7d" });
      res.json({
        user: {
          id: newUser[0].id,
          name: newUser[0].name,
          email: newUser[0].email,
          role: newUser[0].role,
          selectedCourses: JSON.parse(newUser[0].selectedCourses || "[]"),
          username: newUser[0].username,
          createdAt: newUser[0].createdAt
        },
        token
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/courses", async (req, res) => {
    try {
      const allCourses = await db.select().from(courses);
      res.json(allCourses);
    } catch (error) {
      console.error("Get courses error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/courses", authenticateToken, requireRole(["admin", "lecturer"]), async (req, res) => {
    try {
      const { name, code, category, description, lecturerId } = req.body;
      const newCourse = await db.insert(courses).values({
        id: randomUUID(),
        name,
        code,
        category,
        description,
        lecturerId
      }).returning();
      res.json(newCourse[0]);
    } catch (error) {
      console.error("Create course error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/sessions", async (req, res) => {
    try {
      const allSessions = await db.select().from(liveSessions);
      res.json(allSessions);
    } catch (error) {
      console.error("Get sessions error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/sessions", authenticateToken, requireRole("lecturer"), async (req, res) => {
    try {
      const { courseId, lecturerId, topic, scheduledTime } = req.body;
      console.log("Creating session with", { courseId, lecturerId, topic, scheduledTime });
      const lecturer = await db.select().from(users).where(eq(users.id, lecturerId)).limit(1);
      if (lecturer.length === 0) {
        console.log("Lecturer not found:", lecturerId);
        return res.status(400).json({ error: "Lecturer not found" });
      }
      const existingLiveSession = await db.select().from(liveSessions).where(and(eq(liveSessions.lecturerId, lecturerId), eq(liveSessions.isLive, 1))).limit(1);
      if (existingLiveSession.length > 0) {
        console.log("Lecturer already has a live session:", existingLiveSession[0].id);
        return res.status(400).json({ error: "You already have an active live session. Please end it before starting a new one." });
      }
      const course = await db.select().from(courses).where(eq(courses.id, courseId)).limit(1);
      if (course.length === 0) {
        console.log("Course not found:", courseId);
        return res.status(400).json({ error: "Course not found" });
      }
      const lecturerName = lecturer[0].name || lecturer[0].email.split("@")[0];
      const newSession = await db.insert(liveSessions).values({
        id: randomUUID(),
        courseId,
        lecturerId,
        topic,
        scheduledTime: scheduledTime ? Math.floor(new Date(scheduledTime).getTime() / 1e3) : null,
        startTime: !scheduledTime ? Math.floor(Date.now() / 1e3) : null,
        // Set start time for live sessions
        isLive: !scheduledTime ? 1 : 0,
        // Live if no scheduled time, scheduled if has time
        lecturerName
      }).returning();
      if (io && newSession[0].isLive) {
        io.emit("session-started", { session: newSession[0] });
      }
      res.json(newSession[0]);
    } catch (error) {
      console.error("Create session error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.put("/api/sessions/:id/end", async (req, res) => {
    try {
      const { id } = req.params;
      const updatedSession = await db.update(liveSessions).set({ isLive: 0, endTime: Math.floor(Date.now() / 1e3) }).where(eq(liveSessions.id, id)).returning();
      if (updatedSession.length === 0) {
        return res.status(404).json({ error: "Session not found" });
      }
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
  app2.delete("/api/sessions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(liveSessions).where(eq(liveSessions.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error("Delete session error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.put("/api/sessions/:id/document", async (req, res) => {
    try {
      const { id } = req.params;
      const { currentDocument, currentPage, annotations, currentTool } = req.body;
      const updateData = {};
      if (currentDocument !== void 0) updateData.currentDocument = currentDocument ? JSON.stringify(currentDocument) : null;
      if (currentPage !== void 0) updateData.currentPage = currentPage;
      if (annotations !== void 0) updateData.annotations = JSON.stringify(annotations);
      if (currentTool !== void 0) updateData.currentTool = currentTool;
      const updatedSession = await db.update(liveSessions).set(updateData).where(eq(liveSessions.id, id)).returning();
      if (updatedSession.length === 0) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json(updatedSession[0]);
    } catch (error) {
      console.error("Update document state error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/sessions/:sessionId/messages", async (req, res) => {
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
  app2.post("/api/messages", async (req, res) => {
    try {
      const { sessionId, userId, message } = req.body;
      const newMessage = await db.insert(chatMessages).values({
        id: randomUUID(),
        sessionId,
        userId,
        message
      }).returning();
      res.json(newMessage[0]);
    } catch (error) {
      console.error("Create message error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/documents", async (req, res) => {
    try {
      const { sessionId, userId, title, fileUrl, fileType } = req.body;
      const newDocument = await db.insert(sharedDocuments).values({
        id: randomUUID(),
        sessionId,
        userId,
        title,
        fileUrl,
        fileType
      }).returning();
      res.json(newDocument[0]);
    } catch (error) {
      console.error("Share document error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/materials", async (req, res) => {
    try {
      const { lecturerId, courseIds, limit = "50", offset = "0" } = req.query;
      console.log("GET /api/materials called with lecturerId:", lecturerId, "courseIds:", courseIds);
      const limitNum = parseInt(limit, 10);
      const offsetNum = parseInt(offset, 10);
      let lecturerIds = [];
      if (lecturerId) {
        if (Array.isArray(lecturerId)) {
          lecturerIds = lecturerId.filter((id) => typeof id === "string" && id.trim()).map((id) => id.trim());
        } else if (typeof lecturerId === "string") {
          lecturerIds = lecturerId.split(",").filter((id) => id.trim());
        }
      }
      if (lecturerIds.length > 0) {
        const existingLecturers = await db.select().from(users).where(and(inArray(users.id, lecturerIds), eq(users.role, "lecturer")));
        if (existingLecturers.length !== lecturerIds.length) {
          return res.status(400).json({ error: "One or more lecturers not found" });
        }
      }
      const lecturerIdsStr = lecturerIds.sort().join(",");
      const courseIdsStr = courseIds ? courseIds.split(",").sort().join(",") : "";
      const cacheKey = lecturerIdsStr ? `materials_${lecturerIdsStr}_${limit}_${offset}` : courseIdsStr ? `materials_courses_${courseIdsStr}_${limit}_${offset}` : `materials_all_${limit}_${offset}`;
      const now = Date.now();
      const cached = materialsCache.get(cacheKey);
      if (cached && now - cached.timestamp < CACHE_TTL) {
        console.log("Returning cached data for", cacheKey, "length:", cached.data.length);
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
        isDeleted: lecturerMaterials.isDeleted
      };
      const conditions = [eq(lecturerMaterials.isDeleted, 0)];
      if (lecturerIds.length > 0) {
        console.log("Building or condition with lecturerIds:", lecturerIds);
        conditions.push(or(
          inArray(lecturerMaterials.lecturerId, lecturerIds),
          inArray(courses.lecturerId, lecturerIds)
        ));
      }
      if (courseIds) {
        const courseIdArray = courseIds.split(",").filter((id) => id.trim());
        if (courseIdArray.length > 0) {
          conditions.push(inArray(lecturerMaterials.courseId, courseIdArray));
        }
      }
      const whereCondition = conditions.length > 1 ? and(...conditions) : conditions[0];
      console.log("Querying materials with whereCondition:", whereCondition);
      const query = db.select(selectFields).from(lecturerMaterials).leftJoin(courses, eq(lecturerMaterials.courseId, courses.id)).where(whereCondition).limit(limitNum).offset(offsetNum);
      const allMaterials = await query;
      console.log("Found materials:", allMaterials.length);
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const materialsWithUrls = allMaterials.map((material) => ({
        ...material,
        url: material.fileUrl ? `${baseUrl}${material.fileUrl}` : null
      }));
      materialsCache.set(cacheKey, { data: materialsWithUrls, timestamp: now });
      res.json(materialsWithUrls);
    } catch (error) {
      console.error("Get materials error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/materials", upload.single("file"), async (req, res) => {
    try {
      console.log("Received upload request");
      console.log("Request body:", req.body);
      console.log("File received:", req.file ? { name: req.file.originalname, size: req.file.size, mimetype: req.file.mimetype } : "No file");
      const { lecturerId, courseId, title, description, fileType, content } = req.body;
      let fileUrl = null;
      let fileContent = content;
      let size = null;
      if (req.file) {
        fileContent = req.file.buffer.toString("base64");
        size = req.file.size;
        console.log("Converting file to base64, length:", fileContent.length);
      } else if (content) {
        size = Buffer.byteLength(content, "utf8");
        console.log("Using provided content, size:", size);
      }
      console.log("Inserting into database...");
      const newMaterial = await db.insert(lecturerMaterials).values({
        id: randomUUID(),
        lecturerId,
        courseId,
        title,
        description,
        fileUrl,
        fileType: fileType || (req.file ? req.file.mimetype : null),
        content: fileContent,
        size
      }).returning();
      console.log("Material inserted:", newMaterial[0].id);
      await db.insert(userAnalytics).values({
        id: randomUUID(),
        userId: lecturerId,
        metric: "materials_uploaded",
        value: 1,
        date: Math.floor(Date.now() / 1e3)
      });
      if (req.file) {
        fileUrl = `/api/files/${newMaterial[0].id}`;
        console.log("Updating fileUrl...");
        await db.update(lecturerMaterials).set({ fileUrl }).where(eq(lecturerMaterials.id, newMaterial[0].id));
        newMaterial[0].fileUrl = fileUrl;
        console.log("FileUrl updated");
      }
      console.log("Upload successful, responding with:", newMaterial[0].title);
      res.json(newMaterial[0]);
      for (const key of materialsCache.keys()) {
        if (key.startsWith("materials_")) {
          materialsCache.delete(key);
        }
      }
      if (io) {
        io.emit("material-updated", { courseId });
      }
    } catch (error) {
      console.error("Create material error:", error);
      console.error("Error details:", error instanceof Error ? error.message : error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.delete("/api/materials/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const material = await db.select().from(lecturerMaterials).where(and(eq(lecturerMaterials.id, id), eq(lecturerMaterials.isDeleted, 0))).limit(1);
      if (material.length === 0) {
        return res.status(404).json({ error: "Material not found" });
      }
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
        createdAt: material[0].createdAt
      });
      await db.update(lecturerMaterials).set({ isDeleted: 1 }).where(eq(lecturerMaterials.id, id));
      res.json({ success: true });
      for (const key of materialsCache.keys()) {
        if (key.startsWith("materials_")) {
          materialsCache.delete(key);
        }
      }
      if (io) {
        io.emit("material-updated", { courseId: material[0].courseId });
      }
    } catch (error) {
      console.error("Delete material error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/debug/materials", async (req, res) => {
    try {
      const allMaterials = await db.select().from(lecturerMaterials).where(eq(lecturerMaterials.isDeleted, 0));
      res.json(allMaterials);
    } catch (error) {
      console.error("Debug materials error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/debug/assignments", async (req, res) => {
    try {
      const assignments = await db.select().from(userTutors);
      const requests = await db.select().from(tutorRequests);
      res.json({ assignments, requests });
    } catch (error) {
      console.error("Debug assignments error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/debug/requests", async (req, res) => {
    try {
      const requests = await db.select().from(tutorRequests);
      res.json(requests);
    } catch (error) {
      console.error("Debug requests error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/files/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const material = await db.select().from(lecturerMaterials).where(and(eq(lecturerMaterials.id, id), eq(lecturerMaterials.isDeleted, 0))).limit(1);
      if (material.length === 0 || !material[0].content) {
        return res.status(404).json({ error: "File not found" });
      }
      const fileBuffer = Buffer.from(material[0].content, "base64");
      const mimeType = material[0].fileType || "application/octet-stream";
      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Disposition", `inline; filename="${material[0].title}"`);
      res.send(fileBuffer);
    } catch (error) {
      console.error("File retrieval error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/tutor-requests", authenticateToken, async (req, res) => {
    try {
      console.log("GET /api/tutor-requests called by userId:", req.user.userId);
      const { studentId: studentIdParam, limit = "10", offset = "0", status } = req.query;
      const studentId = typeof studentIdParam === "string" ? studentIdParam : void 0;
      const limitNum = parseInt(limit, 10);
      const offsetNum = parseInt(offset, 10);
      const userId = req.user.userId;
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (user.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      const userRole = user[0].role;
      console.log("User role:", userRole, "for userId:", userId);
      let requests = [];
      if (studentId) {
        if (userRole === "student" && studentId !== userId) {
          return res.status(403).json({ error: "Access denied" });
        }
        requests = await db.select().from(tutorRequests).where(eq(tutorRequests.studentId, studentId));
        console.log("Debug: requests assigned for studentId, length:", requests.length);
      } else {
        if (userRole === "student") {
          requests = await db.select().from(tutorRequests).where(eq(tutorRequests.studentId, userId));
          console.log("Debug: requests assigned for student, length:", requests.length);
        } else if (userRole === "tutor") {
          requests = await db.select().from(tutorRequests);
          console.log("Debug: requests assigned for tutor, length:", requests.length);
        } else {
          requests = await db.select().from(tutorRequests);
          console.log("Debug: requests assigned for admin/lecturer, length:", requests.length);
        }
      }
      if (status) {
        requests = requests.filter((r) => r.status === status);
      }
      const total = requests.length;
      requests = requests.slice(offsetNum, offsetNum + limitNum);
      res.json({ requests, total });
    } catch (error) {
      console.error("Get tutor requests error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/tutor-requests", authenticateToken, async (req, res) => {
    try {
      const { courseId, type, title, description, messages } = req.body;
      const studentId = req.user.userId;
      console.log("Debug: Creating tutor request for studentId:", studentId, "courseId:", courseId, "title:", title);
      const newRequest = await db.insert(tutorRequests).values({
        id: randomUUID(),
        studentId,
        courseId,
        type,
        title,
        description,
        messages
      }).returning();
      console.log("Debug: Tutor request created successfully, id:", newRequest[0].id);
      res.json(newRequest[0]);
    } catch (error) {
      console.error("Create tutor request error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.put("/api/tutor-requests/:id", authenticateToken, requireRole(["student", "tutor", "lecturer", "admin"]), async (req, res) => {
    try {
      const { id } = req.params;
      const { status, response, messages } = req.body;
      const userId = req.user.userId;
      const userRole = req.userDetails.role;
      if (userRole === "student") {
        const request = await db.select().from(tutorRequests).where(eq(tutorRequests.id, id)).limit(1);
        if (request.length === 0 || request[0].studentId !== userId) {
          return res.status(403).json({ error: "Access denied" });
        }
      } else if (!["tutor", "lecturer", "admin"].includes(userRole)) {
        return res.status(403).json({ error: "Access denied" });
      }
      const updateData = { updatedAt: Math.floor(Date.now() / 1e3) };
      if (status !== void 0) updateData.status = status;
      if (response !== void 0) updateData.response = response;
      if (messages !== void 0) updateData.messages = messages;
      const updatedRequest = await db.update(tutorRequests).set(updateData).where(eq(tutorRequests.id, id)).returning();
      if (updatedRequest.length === 0) {
        return res.status(404).json({ error: "Request not found" });
      }
      res.json(updatedRequest[0]);
    } catch (error) {
      console.error("Update tutor request error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.delete("/api/tutor-requests/:id", authenticateToken, requireRole("student"), async (req, res) => {
    try {
      const { id } = req.params;
      const studentId = req.user.userId;
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
  app2.post("/api/tutor-requests/:id/message", authenticateToken, requireRole(["student", "tutor", "lecturer"]), async (req, res) => {
    try {
      const { id } = req.params;
      const { message } = req.body;
      const userId = req.user.userId;
      const userRole = req.userDetails.role;
      const request = await db.select().from(tutorRequests).where(eq(tutorRequests.id, id)).limit(1);
      if (request.length === 0) {
        return res.status(404).json({ error: "Request not found" });
      }
      const tutorRequest = request[0];
      if (userRole === "student" && tutorRequest.studentId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      if (userRole === "tutor") {
        const assignment = await db.select().from(userTutors).where(and(eq(userTutors.studentId, tutorRequest.studentId), eq(userTutors.tutorId, userId))).limit(1);
        if (assignment.length === 0) {
          return res.status(403).json({ error: "Access denied" });
        }
      } else if (userRole === "lecturer") {
      } else if (!["student", "tutor", "lecturer"].includes(userRole)) {
        return res.status(403).json({ error: "Access denied" });
      }
      let messages = [];
      try {
        messages = tutorRequest.messages ? JSON.parse(tutorRequest.messages) : [];
      } catch (e) {
        messages = [];
      }
      const newMessage = {
        sender: userRole === "student" ? "student" : "tutor",
        message: message.trim(),
        timestamp: Date.now(),
        status: "sent"
      };
      messages.push(newMessage);
      const updatedRequest = await db.update(tutorRequests).set({
        messages: JSON.stringify(messages),
        updatedAt: Math.floor(Date.now() / 1e3)
      }).where(eq(tutorRequests.id, id)).returning();
      if (updatedRequest.length === 0) {
        return res.status(404).json({ error: "Request not found" });
      }
      res.json(updatedRequest[0]);
    } catch (error) {
      console.error("Send message error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/admin/users", authenticateToken, requireRole(["admin", "tutor"]), async (req, res) => {
    try {
      const allUsers = await db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt
      }).from(users);
      res.json(allUsers);
    } catch (error) {
      console.error("Get admin users error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/admin/users", authenticateToken, requireRole("admin"), async (req, res) => {
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
        password,
        // Note: should hash in production
        name,
        role: role || "student",
        selectedCourses: "[]"
      }).returning();
      res.json({
        id: newUser[0].id,
        username: newUser[0].username,
        email: newUser[0].email,
        name: newUser[0].name,
        role: newUser[0].role,
        createdAt: newUser[0].createdAt
      });
    } catch (error) {
      console.error("Admin create user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.put("/api/admin/users/:id", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const { id } = req.params;
      const { name, role, selectedCourses } = req.body;
      const updateData = {};
      if (name !== void 0) updateData.name = name;
      if (role !== void 0) updateData.role = role;
      if (selectedCourses !== void 0) updateData.selectedCourses = JSON.stringify(selectedCourses);
      const updatedUser = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
      if (updatedUser.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({
        id: updatedUser[0].id,
        username: updatedUser[0].username,
        email: updatedUser[0].email,
        name: updatedUser[0].name,
        role: updatedUser[0].role,
        createdAt: updatedUser[0].createdAt
      });
    } catch (error) {
      console.error("Admin update user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.delete("/api/admin/users/:id", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const { id } = req.params;
      if (req.user.userId === id) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }
      const references = [];
      const courseRefs = await db.select().from(courses).where(eq(courses.lecturerId, id));
      if (courseRefs.length > 0) references.push(`courses (${courseRefs.length})`);
      const sessionRefs = await db.select().from(liveSessions).where(eq(liveSessions.lecturerId, id));
      if (sessionRefs.length > 0) references.push(`live sessions (${sessionRefs.length})`);
      const materialRefs = await db.select().from(lecturerMaterials).where(eq(lecturerMaterials.lecturerId, id));
      if (materialRefs.length > 0) references.push(`lecturer materials (${materialRefs.length})`);
      const tutorRefs = await db.select().from(userTutors).where(or(eq(userTutors.studentId, id), eq(userTutors.tutorId, id), eq(userTutors.assignedBy, id)));
      if (tutorRefs.length > 0) references.push(`tutor assignments (${tutorRefs.length})`);
      const supportRefs = await db.select().from(supportRequests).where(or(eq(supportRequests.userId, id), eq(supportRequests.assignedTo, id)));
      if (supportRefs.length > 0) references.push(`support requests (${supportRefs.length})`);
      if (references.length > 0) {
        return res.status(400).json({
          error: `Cannot delete user because they are referenced in: ${references.join(", ")}. Please reassign or remove these references first.`
        });
      }
      await db.delete(users).where(eq(users.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error("Admin delete user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.put("/api/admin/users/:id/password", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const { id } = req.params;
      const { password } = req.body;
      const updatedUser = await db.update(users).set({ password }).where(eq(users.id, id)).returning();
      if (updatedUser.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Admin change password error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/admin/support", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const requests = await db.select().from(supportRequests);
      res.json(requests);
    } catch (error) {
      console.error("Get support requests error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/admin/support", authenticateToken, async (req, res) => {
    try {
      const { type, title, description } = req.body;
      const userId = req.user.userId;
      const newRequest = await db.insert(supportRequests).values({
        id: randomUUID(),
        userId,
        type,
        title,
        description
      }).returning();
      res.json(newRequest[0]);
    } catch (error) {
      console.error("Create support request error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.put("/api/admin/support/:id", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const { id } = req.params;
      const { status, assignedTo } = req.body;
      const updateData = { updatedAt: Math.floor(Date.now() / 1e3) };
      if (status !== void 0) updateData.status = status;
      if (assignedTo !== void 0) updateData.assignedTo = assignedTo;
      const updatedRequest = await db.update(supportRequests).set(updateData).where(eq(supportRequests.id, id)).returning();
      if (updatedRequest.length === 0) {
        return res.status(404).json({ error: "Support request not found" });
      }
      res.json(updatedRequest[0]);
    } catch (error) {
      console.error("Update support request error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/admin/analytics", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const analytics = await db.select().from(userAnalytics);
      res.json(analytics);
    } catch (error) {
      console.error("Get analytics error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/admin/analytics", authenticateToken, async (req, res) => {
    try {
      const { userId, metric, value, date } = req.body;
      await db.insert(userAnalytics).values({
        id: randomUUID(),
        userId,
        metric,
        value,
        date
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Track analytics error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/admin/payments/analytics", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      console.log("Payment analytics route called");
      const { startDate, endDate } = req.query;
      const startTimestamp = startDate ? Math.floor(new Date(startDate).getTime() / 1e3) : 0;
      const endTimestamp = endDate ? Math.floor(new Date(endDate).getTime() / 1e3) : Math.floor(Date.now() / 1e3);
      const revenueResult = await db.select({
        totalRevenue: sql2`SUM(${payments.amount})`,
        totalTransactions: sql2`COUNT(*)`
      }).from(payments).where(and(
        eq(payments.status, "completed"),
        gte(payments.createdAt, startTimestamp),
        lte(payments.createdAt, endTimestamp)
      ));
      const revenueByCurrency = await db.select({
        currency: payments.currency,
        revenue: sql2`SUM(${payments.amount})`,
        transactions: sql2`COUNT(*)`
      }).from(payments).where(and(
        eq(payments.status, "completed"),
        gte(payments.createdAt, startTimestamp),
        lte(payments.createdAt, endTimestamp)
      )).groupBy(payments.currency);
      const revenueByMethod = await db.select({
        paymentMethod: payments.paymentMethod,
        revenue: sql2`SUM(${payments.amount})`,
        transactions: sql2`COUNT(*)`
      }).from(payments).where(and(
        eq(payments.status, "completed"),
        gte(payments.createdAt, startTimestamp),
        lte(payments.createdAt, endTimestamp)
      )).groupBy(payments.paymentMethod);
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
          email: users.email
        }
      }).from(payments).leftJoin(users, eq(payments.userId, users.id)).orderBy(payments.createdAt).limit(50);
      const activeSubscriptions = await db.select({
        count: sql2`COUNT(*)`
      }).from(userSubscriptions).where(eq(userSubscriptions.status, "active"));
      const subscriptionRevenue = await db.select({
        revenue: sql2`SUM(${subscriptionPlans.price})`,
        subscriptions: sql2`COUNT(*)`
      }).from(userSubscriptions).leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id)).where(and(
        eq(userSubscriptions.status, "active"),
        gte(userSubscriptions.createdAt, startTimestamp),
        lte(userSubscriptions.createdAt, endTimestamp)
      ));
      res.json({
        overview: {
          totalRevenue: revenueResult[0]?.totalRevenue || 0,
          totalTransactions: revenueResult[0]?.totalTransactions || 0,
          activeSubscriptions: activeSubscriptions[0]?.count || 0,
          subscriptionRevenue: subscriptionRevenue[0]?.revenue || 0,
          totalSubscriptionCount: subscriptionRevenue[0]?.subscriptions || 0
        },
        revenueByCurrency,
        revenueByMethod,
        recentPayments,
        dateRange: {
          startDate: startDate || "all",
          endDate: endDate || "now"
        }
      });
    } catch (error) {
      console.error("Get payment analytics error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/admin/payments", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const { limit = "50", offset = "0", status, userId, startDate, endDate } = req.query;
      const limitNum = parseInt(limit, 10);
      const offsetNum = parseInt(offset, 10);
      let conditions = [];
      if (status) {
        conditions.push(eq(payments.status, status));
      }
      if (userId) {
        conditions.push(eq(payments.userId, userId));
      }
      if (startDate) {
        conditions.push(gte(payments.createdAt, Math.floor(new Date(startDate).getTime() / 1e3)));
      }
      if (endDate) {
        conditions.push(lte(payments.createdAt, Math.floor(new Date(endDate).getTime() / 1e3)));
      }
      const whereCondition = conditions.length > 0 ? and(...conditions) : void 0;
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
          email: users.email
        }
      }).from(payments).leftJoin(users, eq(payments.userId, users.id)).where(whereCondition).orderBy(payments.createdAt).limit(limitNum).offset(offsetNum);
      const totalResult = await db.select({
        count: sql2`COUNT(*)`
      }).from(payments).where(whereCondition);
      res.json({
        payments: paymentsList,
        total: totalResult[0]?.count || 0,
        limit: limitNum,
        offset: offsetNum
      });
    } catch (error) {
      console.error("Get admin payments error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/admin/subscriptions/analytics", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const startTimestamp = startDate ? Math.floor(new Date(startDate).getTime() / 1e3) : 0;
      const endTimestamp = endDate ? Math.floor(new Date(endDate).getTime() / 1e3) : Math.floor(Date.now() / 1e3);
      const statusBreakdown = await db.select({
        status: userSubscriptions.status,
        count: sql2`COUNT(*)`
      }).from(userSubscriptions).where(and(
        gte(userSubscriptions.createdAt, startTimestamp),
        lte(userSubscriptions.createdAt, endTimestamp)
      )).groupBy(userSubscriptions.status);
      const popularPlans = await db.select({
        planId: subscriptionPlans.id,
        planName: subscriptionPlans.name,
        price: subscriptionPlans.price,
        currency: subscriptionPlans.currency,
        count: sql2`COUNT(*)`,
        revenue: sql2`SUM(${subscriptionPlans.price})`
      }).from(userSubscriptions).leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id)).where(and(
        eq(userSubscriptions.status, "active"),
        gte(userSubscriptions.createdAt, startTimestamp),
        lte(userSubscriptions.createdAt, endTimestamp)
      )).groupBy(subscriptionPlans.id, subscriptionPlans.name, subscriptionPlans.price, subscriptionPlans.currency).orderBy(sql2`COUNT(*) DESC`);
      const churnData = await db.select({
        status: userSubscriptions.status,
        count: sql2`COUNT(*)`
      }).from(userSubscriptions).where(gte(userSubscriptions.updatedAt, startTimestamp)).groupBy(userSubscriptions.status);
      res.json({
        statusBreakdown,
        popularPlans,
        churnData,
        dateRange: {
          startDate: startDate || "all",
          endDate: endDate || "now"
        }
      });
    } catch (error) {
      console.error("Get subscription analytics error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/admin/overdue-students", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const now = Math.floor(Date.now() / 1e3);
      const overdueSubscriptions = await db.select({
        userId: userSubscriptions.userId,
        endDate: userSubscriptions.endDate
      }).from(userSubscriptions).where(and(
        eq(userSubscriptions.status, "active"),
        lte(userSubscriptions.endDate, now)
      ));
      if (overdueSubscriptions.length === 0) {
        return res.json([]);
      }
      const userIds = overdueSubscriptions.map((sub) => sub.userId).filter((id) => id !== null);
      const userDetails = await db.select({
        id: users.id,
        name: users.name,
        email: users.email
      }).from(users).where(inArray(users.id, userIds));
      const overdueStudents = userDetails.map((user) => {
        const subscription = overdueSubscriptions.find((sub) => sub.userId === user.id);
        const daysOverdue = subscription ? Math.floor((now - subscription.endDate) / (24 * 60 * 60)) : 0;
        return {
          userId: user.id,
          name: user.name,
          email: user.email,
          endDate: subscription?.endDate || 0,
          daysOverdue
        };
      }).sort((a, b) => b.daysOverdue - a.daysOverdue);
      res.json(overdueStudents);
    } catch (error) {
      console.error("Get overdue students error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/admin/users/analytics", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const startTimestamp = startDate ? Math.floor(new Date(startDate).getTime() / 1e3) : 0;
      const endTimestamp = endDate ? Math.floor(new Date(endDate).getTime() / 1e3) : Math.floor(Date.now() / 1e3);
      const usersByRole = await db.select({
        role: users.role,
        count: sql2`COUNT(*)`
      }).from(users).groupBy(users.role);
      const registrationTrends = await db.select({
        date: sql2`DATE(${users.createdAt}, 'unixepoch')`,
        count: sql2`COUNT(*)`
      }).from(users).where(and(
        gte(users.createdAt, startTimestamp),
        lte(users.createdAt, endTimestamp)
      )).groupBy(sql2`DATE(${users.createdAt}, 'unixepoch')`).orderBy(sql2`DATE(${users.createdAt}, 'unixepoch')`);
      const recentUsers = await db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt
      }).from(users).orderBy(users.createdAt).limit(10);
      res.json({
        usersByRole,
        registrationTrends,
        recentUsers,
        dateRange: {
          startDate: startDate || "all",
          endDate: endDate || "now"
        }
      });
    } catch (error) {
      console.error("Get user analytics error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/admin/courses/analytics", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const coursePopularity = await db.select({
        courseId: courses.id,
        courseName: courses.name,
        courseCode: courses.code,
        lecturerName: courses.lecturerName,
        enrollmentCount: sql2`COUNT(DISTINCT ${userTutors.studentId})`
      }).from(courses).leftJoin(userTutors, eq(courses.id, userTutors.courseId)).groupBy(courses.id, courses.name, courses.code, courses.lecturerName).orderBy(sql2`COUNT(DISTINCT ${userTutors.studentId}) DESC`).limit(10);
      const coursesByCategory = await db.select({
        category: courses.category,
        count: sql2`COUNT(*)`
      }).from(courses).groupBy(courses.category);
      const totalStats = await db.select({
        totalCourses: sql2`COUNT(DISTINCT ${courses.id})`,
        totalEnrollments: sql2`COUNT(DISTINCT ${userTutors.studentId})`,
        activeTutors: sql2`COUNT(DISTINCT ${userTutors.tutorId})`
      }).from(courses).leftJoin(userTutors, eq(courses.id, userTutors.courseId)).where(eq(userTutors.status, "active"));
      res.json({
        popularCourses: coursePopularity,
        coursesByCategory,
        overview: {
          totalCourses: totalStats[0]?.totalCourses || 0,
          totalEnrollments: totalStats[0]?.totalEnrollments || 0,
          activeTutors: totalStats[0]?.activeTutors || 0
        }
      });
    } catch (error) {
      console.error("Get course analytics error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/admin/support/analytics", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const startTimestamp = startDate ? Math.floor(new Date(startDate).getTime() / 1e3) : 0;
      const endTimestamp = endDate ? Math.floor(new Date(endDate).getTime() / 1e3) : Math.floor(Date.now() / 1e3);
      const requestsByStatus = await db.select({
        status: supportRequests.status,
        count: sql2`COUNT(*)`
      }).from(supportRequests).where(and(
        gte(supportRequests.createdAt, startTimestamp),
        lte(supportRequests.createdAt, endTimestamp)
      )).groupBy(supportRequests.status);
      const requestsByType = await db.select({
        type: supportRequests.type,
        count: sql2`COUNT(*)`
      }).from(supportRequests).where(and(
        gte(supportRequests.createdAt, startTimestamp),
        lte(supportRequests.createdAt, endTimestamp)
      )).groupBy(supportRequests.type);
      const recentRequests = await db.select({
        id: supportRequests.id,
        type: supportRequests.type,
        title: supportRequests.title,
        status: supportRequests.status,
        createdAt: supportRequests.createdAt,
        user: {
          name: users.name,
          email: users.email
        }
      }).from(supportRequests).leftJoin(users, eq(supportRequests.userId, users.id)).orderBy(supportRequests.createdAt).limit(5);
      const unresolvedCount = await db.select({
        count: sql2`COUNT(*)`
      }).from(supportRequests).where(ne(supportRequests.status, "resolved"));
      res.json({
        requestsByStatus,
        requestsByType,
        recentRequests,
        overview: {
          totalRequests: requestsByStatus.reduce((sum, item) => sum + item.count, 0),
          unresolvedRequests: unresolvedCount[0]?.count || 0
        },
        dateRange: {
          startDate: startDate || "all",
          endDate: endDate || "now"
        }
      });
    } catch (error) {
      console.error("Get support analytics error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/admin/tutors", authenticateToken, async (req, res) => {
    try {
      const assignments = await db.select().from(userTutors);
      res.json(assignments);
    } catch (error) {
      console.error("Get tutor assignments error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/admin/tutors", authenticateToken, async (req, res) => {
    try {
      const { studentId, tutorId, courseId } = req.body;
      const userId = req.user.userId;
      const userRole = req.userDetails.role;
      if (userRole !== "admin" && userRole !== "tutor") {
        return res.status(403).json({ error: "Access denied" });
      }
      if (userRole === "tutor" && tutorId !== userId) {
        return res.status(403).json({ error: "Tutors can only assign themselves" });
      }
      const assignedBy = userId;
      const newAssignment = await db.insert(userTutors).values({
        id: randomUUID(),
        studentId,
        tutorId,
        courseId,
        assignedBy
      }).returning();
      res.json(newAssignment[0]);
    } catch (error) {
      console.error("Create tutor assignment error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.delete("/api/admin/tutors/:id", authenticateToken, async (req, res) => {
    const user = await db.select().from(users).where(eq(users.id, req.user.userId)).limit(1);
    if (user.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const userRole = user[0].role;
    const userId = req.user.userId;
    try {
      const { id } = req.params;
      const userId2 = req.user.userId;
      const userRole2 = req.userDetails.role;
      const assignment = await db.select().from(userTutors).where(eq(userTutors.id, id)).limit(1);
      if (assignment.length === 0) {
        return res.status(404).json({ error: "Assignment not found" });
      }
      if (userRole2 !== "admin" && !(userRole2 === "tutor" && assignment[0].tutorId === userId2)) {
        return res.status(403).json({ error: "Access denied" });
      }
      await db.delete(userTutors).where(eq(userTutors.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error("Delete tutor assignment error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/my-tutors", authenticateToken, requireRole("student"), async (req, res) => {
    try {
      const studentId = req.user.userId;
      const assignedTutors = await db.select({
        tutor: {
          id: users.id,
          name: users.name,
          email: users.email
        },
        course: {
          id: courses.id,
          name: courses.name,
          code: courses.code
        },
        assignedAt: userTutors.assignedAt,
        status: userTutors.status
      }).from(userTutors).leftJoin(users, eq(userTutors.tutorId, users.id)).leftJoin(courses, eq(userTutors.courseId, courses.id)).where(and(eq(userTutors.studentId, studentId), eq(userTutors.status, "active")));
      const debugRequests = await db.select().from(tutorRequests).where(eq(tutorRequests.studentId, studentId));
      console.log("All tutor requests for student", studentId, ":", debugRequests);
      const allRequests = await db.select().from(tutorRequests).where(eq(tutorRequests.studentId, studentId));
      console.log("All requests for student", studentId, ":", allRequests);
      res.json({ assignedTutors, requests: allRequests });
    } catch (error) {
      console.error("Get my tutors error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  if (stripe) {
    app2.post("/api/payments/create-intent", authenticateToken, async (req, res) => {
      try {
        const { amount, currency = "usd", description, subscriptionId, paymentMethodId } = req.body;
        const userId = req.user.userId;
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amount * 100,
          // Stripe expects amount in cents
          currency,
          description,
          metadata: {
            userId,
            subscriptionId: subscriptionId || ""
          },
          payment_method: paymentMethodId,
          confirmation_method: "manual",
          capture_method: "automatic"
        });
        const payment = await db.insert(payments).values({
          id: randomUUID(),
          userId,
          subscriptionId,
          amount,
          currency: currency.toUpperCase(),
          status: "pending",
          paymentMethod: "stripe",
          transactionId: paymentIntent.id,
          description
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
    app2.post("/api/payments/confirm/:paymentId", authenticateToken, async (req, res) => {
      try {
        const { paymentId } = req.params;
        const { paymentIntentId } = req.body;
        const userId = req.user.userId;
        const payment = await db.select().from(payments).where(and(
          eq(payments.id, paymentId),
          eq(payments.userId, userId)
        )).limit(1);
        if (payment.length === 0) {
          return res.status(404).json({ error: "Payment not found" });
        }
        const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId);
        const now = Math.floor(Date.now() / 1e3);
        const newStatus = paymentIntent.status === "succeeded" ? "completed" : paymentIntent.status === "requires_payment_method" || paymentIntent.status === "requires_confirmation" ? "failed" : paymentIntent.status;
        await db.update(payments).set({
          status: newStatus,
          transactionId: paymentIntent.id,
          updatedAt: now
        }).where(eq(payments.id, paymentId));
        if (newStatus === "completed") {
          if (payment[0].subscriptionId) {
            await db.update(userSubscriptions).set({
              status: "active"
            }).where(eq(userSubscriptions.id, payment[0].subscriptionId));
          }
          await createNotification(userId, "payment_success", "Payment Successful", `Your payment of ${(payment[0].amount / 100).toFixed(2)} has been processed successfully.`, { paymentId });
        } else if (newStatus === "failed") {
          await handlePaymentFailure(paymentIntent.id);
        }
        res.json({ success: true, status: paymentIntent.status });
      } catch (error) {
        console.error("Confirm payment error:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    app2.post("/api/payments/webhook", async (req, res) => {
      const sig = req.headers["stripe-signature"];
      if (!sig || typeof sig !== "string") {
        return res.status(400).send("Invalid signature");
      }
      let event;
      try {
        event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
      } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
      try {
        switch (event.type) {
          case "payment_intent.succeeded":
            const paymentIntent = event.data.object;
            console.log("Payment succeeded:", paymentIntent.id);
            const now = Math.floor(Date.now() / 1e3);
            const paymentsToUpdate = await db.select().from(payments).where(eq(payments.transactionId, paymentIntent.id));
            for (const payment of paymentsToUpdate) {
              if (!payment.userId) {
                console.error("Payment has no userId:", payment.id);
                continue;
              }
              await db.update(payments).set({
                status: "completed",
                updatedAt: now
              }).where(eq(payments.id, payment.id));
              if (payment.subscriptionId) {
                await db.update(userSubscriptions).set({
                  status: "active"
                }).where(eq(userSubscriptions.id, payment.subscriptionId));
              }
              await createNotification(payment.userId, "payment_success", "Payment Successful", `Your payment of ${(payment.amount / 100).toFixed(2)} has been processed successfully.`, { paymentId: payment.id });
            }
            break;
          case "payment_intent.payment_failed":
            const failedPaymentIntent = event.data.object;
            console.log("Payment failed:", failedPaymentIntent.id);
            await handlePaymentFailure(failedPaymentIntent.id);
            break;
          case "charge.dispute.created":
            const dispute = event.data.object;
            console.log("Charge disputed:", dispute.id);
            break;
          default:
            console.log(`Unhandled event type ${event.type}`);
        }
        res.json({ received: true });
      } catch (error) {
        console.error("Webhook processing error:", error);
        res.status(500).json({ error: "Webhook processing failed" });
      }
    });
  }
  app2.get("/api/payments", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.userId;
      const { limit = "20", offset = "0" } = req.query;
      const limitNum = parseInt(limit, 10);
      const offsetNum = parseInt(offset, 10);
      const userPayments = await db.select().from(payments).where(eq(payments.userId, userId)).orderBy(payments.createdAt).limit(limitNum).offset(offsetNum);
      res.json(userPayments);
    } catch (error) {
      console.error("Get payments error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/payments/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const payment = await db.select().from(payments).where(and(eq(payments.id, id), eq(payments.userId, userId))).limit(1);
      if (payment.length === 0) {
        return res.status(404).json({ error: "Payment not found" });
      }
      res.json(payment[0]);
    } catch (error) {
      console.error("Get payment error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/payments/:id/refund", authenticateToken, requireRole(["admin", "tutor"]), async (req, res) => {
    try {
      const { id } = req.params;
      const { amount, reason } = req.body;
      if (!stripe) {
        return res.status(400).json({ error: "Payment processing not configured" });
      }
      const payment = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
      if (payment.length === 0) {
        return res.status(404).json({ error: "Payment not found" });
      }
      if (payment[0].status !== "completed") {
        return res.status(400).json({ error: "Can only refund completed payments" });
      }
      const refund = await stripe.refunds.create({
        payment_intent: payment[0].transactionId,
        amount: amount ? amount * 100 : void 0,
        // Partial refund if amount specified
        reason: reason || "requested_by_customer"
      });
      await db.update(payments).set({
        status: refund.amount === payment[0].amount * 100 ? "refunded" : "partially_refunded"
      }).where(eq(payments.id, id));
      if (payment[0].subscriptionId) {
        await db.update(userSubscriptions).set({
          status: "cancelled"
        }).where(eq(userSubscriptions.id, payment[0].subscriptionId));
      }
      res.json({ success: true, refundId: refund.id });
    } catch (error) {
      console.error("Refund payment error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/notifications", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.userId;
      const { limit = "20", offset = "0" } = req.query;
      const limitNum = parseInt(limit, 10);
      const offsetNum = parseInt(offset, 10);
      const userNotifications = await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(notifications.createdAt).limit(limitNum).offset(offsetNum);
      res.json(userNotifications);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.put("/api/notifications/:id/read", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const notification = await db.select().from(notifications).where(and(eq(notifications.id, id), eq(notifications.userId, userId))).limit(1);
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
  app2.get("/api/payment-methods", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.userId;
      const methods = await db.select().from(paymentMethods).where(eq(paymentMethods.userId, userId)).orderBy(paymentMethods.createdAt);
      res.json(methods);
    } catch (error) {
      console.error("Get payment methods error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/payment-methods", authenticateToken, async (req, res) => {
    try {
      const { type, provider, last4, expiryMonth, expiryYear, stripePaymentMethodId } = req.body;
      const userId = req.user.userId;
      if (!stripe) {
        return res.status(400).json({ error: "Payment processing not configured" });
      }
      let stripeCustomerId;
      if (stripePaymentMethodId) {
        const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        if (user.length === 0) {
          return res.status(404).json({ error: "User not found" });
        }
        try {
          const customer = await stripe.customers.create({
            email: user[0].email,
            name: user[0].name,
            metadata: { userId }
          });
          stripeCustomerId = customer.id;
          await stripe.paymentMethods.attach(stripePaymentMethodId, {
            customer: customer.id
          });
        } catch (error) {
          console.error("Stripe customer creation error:", error);
        }
      }
      const newMethod = await db.insert(paymentMethods).values({
        id: randomUUID(),
        userId,
        type: type || "card",
        provider: provider || "stripe",
        last4,
        expiryMonth,
        expiryYear,
        isDefault: 0
        // Will be set to default if it's the first method
      }).returning();
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
  app2.put("/api/payment-methods/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { last4, expiryMonth, expiryYear } = req.body;
      const userId = req.user.userId;
      const method = await db.select().from(paymentMethods).where(and(eq(paymentMethods.id, id), eq(paymentMethods.userId, userId))).limit(1);
      if (method.length === 0) {
        return res.status(404).json({ error: "Payment method not found" });
      }
      const updateData = {};
      if (last4 !== void 0) updateData.last4 = last4;
      if (expiryMonth !== void 0) updateData.expiryMonth = expiryMonth;
      if (expiryYear !== void 0) updateData.expiryYear = expiryYear;
      const updatedMethod = await db.update(paymentMethods).set(updateData).where(eq(paymentMethods.id, id)).returning();
      res.json(updatedMethod[0]);
    } catch (error) {
      console.error("Update payment method error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.delete("/api/payment-methods/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const method = await db.select().from(paymentMethods).where(and(eq(paymentMethods.id, id), eq(paymentMethods.userId, userId))).limit(1);
      if (method.length === 0) {
        return res.status(404).json({ error: "Payment method not found" });
      }
      await db.delete(paymentMethods).where(eq(paymentMethods.id, id));
      if (method[0].isDefault) {
        const remainingMethods = await db.select().from(paymentMethods).where(eq(paymentMethods.userId, userId)).orderBy(paymentMethods.createdAt).limit(1);
        if (remainingMethods.length > 0) {
          await db.update(paymentMethods).set({ isDefault: 1 }).where(eq(paymentMethods.id, remainingMethods[0].id));
        }
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete payment method error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.put("/api/payment-methods/:id/default", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const method = await db.select().from(paymentMethods).where(and(eq(paymentMethods.id, id), eq(paymentMethods.userId, userId))).limit(1);
      if (method.length === 0) {
        return res.status(404).json({ error: "Payment method not found" });
      }
      await db.update(paymentMethods).set({ isDefault: 0 }).where(eq(paymentMethods.userId, userId));
      await db.update(paymentMethods).set({ isDefault: 1 }).where(eq(paymentMethods.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error("Set default payment method error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/subscription-plans", async (req, res) => {
    try {
      const plans = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isActive, 1));
      res.json(plans);
    } catch (error) {
      console.error("Get subscription plans error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/subscription", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.userId;
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
          features: subscriptionPlans.features
        }
      }).from(userSubscriptions).leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id)).where(and(
        eq(userSubscriptions.userId, userId),
        eq(userSubscriptions.status, "active")
      )).orderBy(userSubscriptions.createdAt).limit(1);
      if (subscription.length === 0) {
        return res.json({ subscription: null, isActive: false });
      }
      const sub = subscription[0];
      const now = Math.floor(Date.now() / 1e3);
      const isActive = sub.status === "active" && sub.endDate > now;
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
  app2.post("/api/subscription", authenticateToken, async (req, res) => {
    try {
      const { planId } = req.body;
      const userId = req.user.userId;
      const plan = await db.select().from(subscriptionPlans).where(and(eq(subscriptionPlans.id, planId), eq(subscriptionPlans.isActive, 1))).limit(1);
      if (plan.length === 0) {
        return res.status(404).json({ error: "Subscription plan not found" });
      }
      const existingSub = await db.select().from(userSubscriptions).where(and(
        eq(userSubscriptions.userId, userId),
        eq(userSubscriptions.status, "active")
      )).limit(1);
      if (existingSub.length > 0) {
        return res.status(400).json({ error: "User already has an active subscription" });
      }
      const now = Math.floor(Date.now() / 1e3);
      const endDate = now + plan[0].duration * 24 * 60 * 60;
      const newSubscription = await db.insert(userSubscriptions).values({
        id: randomUUID(),
        userId,
        planId,
        status: "active",
        startDate: now,
        endDate,
        autoRenew: 1
      }).returning();
      res.json(newSubscription[0]);
    } catch (error) {
      console.error("Create subscription error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.put("/api/subscription/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { status, autoRenew } = req.body;
      const userId = req.user.userId;
      const subscription = await db.select().from(userSubscriptions).where(eq(userSubscriptions.id, id)).limit(1);
      if (subscription.length === 0 || subscription[0].userId !== userId) {
        return res.status(404).json({ error: "Subscription not found" });
      }
      const updateData = { updatedAt: Math.floor(Date.now() / 1e3) };
      if (status !== void 0) updateData.status = status;
      if (autoRenew !== void 0) updateData.autoRenew = autoRenew ? 1 : 0;
      const updatedSubscription = await db.update(userSubscriptions).set(updateData).where(eq(userSubscriptions.id, id)).returning();
      res.json(updatedSubscription[0]);
    } catch (error) {
      console.error("Update subscription error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/subscription/:id/cancel", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { cancelAtPeriodEnd = false, reason } = req.body;
      const userId = req.user.userId;
      const subscription = await db.select().from(userSubscriptions).where(eq(userSubscriptions.id, id)).limit(1);
      if (subscription.length === 0 || subscription[0].userId !== userId) {
        return res.status(404).json({ error: "Subscription not found" });
      }
      if (cancelAtPeriodEnd) {
        await db.update(userSubscriptions).set({
          autoRenew: 0,
          updatedAt: Math.floor(Date.now() / 1e3)
        }).where(eq(userSubscriptions.id, id));
      } else {
        await db.update(userSubscriptions).set({
          status: "cancelled",
          autoRenew: 0,
          updatedAt: Math.floor(Date.now() / 1e3)
        }).where(eq(userSubscriptions.id, id));
      }
      res.json({ success: true, cancelAtPeriodEnd });
    } catch (error) {
      console.error("Cancel subscription error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/subscription/:id/renew", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const subscription = await db.select().from(userSubscriptions).where(and(eq(userSubscriptions.id, id), eq(userSubscriptions.userId, userId))).limit(1);
      if (subscription.length === 0) {
        return res.status(404).json({ error: "Subscription not found" });
      }
      const sub = subscription[0];
      if (sub.status !== "expired" && sub.status !== "cancelled") {
        return res.status(400).json({ error: "Subscription is not expired or cancelled" });
      }
      if (!sub.planId) {
        return res.status(400).json({ error: "Subscription has no plan" });
      }
      const plan = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, sub.planId)).limit(1);
      if (plan.length === 0) {
        return res.status(404).json({ error: "Subscription plan not found" });
      }
      const now = Math.floor(Date.now() / 1e3);
      const endDate = now + plan[0].duration * 24 * 60 * 60;
      await db.update(userSubscriptions).set({
        status: "active",
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
  app2.post("/api/subscription/:id/change-plan", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { newPlanId } = req.body;
      const userId = req.user.userId;
      const subscription = await db.select().from(userSubscriptions).where(and(eq(userSubscriptions.id, id), eq(userSubscriptions.userId, userId))).limit(1);
      if (subscription.length === 0) {
        return res.status(404).json({ error: "Subscription not found" });
      }
      const newPlan = await db.select().from(subscriptionPlans).where(and(
        eq(subscriptionPlans.id, newPlanId),
        eq(subscriptionPlans.isActive, 1)
      )).limit(1);
      if (newPlan.length === 0) {
        return res.status(404).json({ error: "New subscription plan not found" });
      }
      const now = Math.floor(Date.now() / 1e3);
      const newEndDate = now + newPlan[0].duration * 24 * 60 * 60;
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
  app2.get("/api/subscription/history", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.userId;
      const { limit = "10", offset = "0" } = req.query;
      const limitNum = parseInt(limit, 10);
      const offsetNum = parseInt(offset, 10);
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
          duration: subscriptionPlans.duration
        }
      }).from(userSubscriptions).leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id)).where(eq(userSubscriptions.userId, userId)).orderBy(userSubscriptions.createdAt).limit(limitNum).offset(offsetNum);
      res.json(subscriptions);
    } catch (error) {
      console.error("Get subscription history error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  return { server: httpServer || createServer(app2), processPaymentRetries };
}

// server/index.ts
import { createServer as createServer2 } from "node:http";
import { Server as SocketServer } from "socket.io";
import * as fs2 from "fs";
import * as path2 from "path";
import { eq as eq2 } from "drizzle-orm";
var app = express();
app.set("etag", false);
var log = console.log;
function setupCors(app2) {
  app2.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Credentials", "true");
    res.removeHeader("X-Frame-Options");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
}
function setupBodyParsing(app2) {
  app2.use(
    express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      }
    })
  );
  app2.use(express.urlencoded({ extended: false }));
}
function setupRequestLogging(app2) {
  app2.use((req, res, next) => {
    const start = Date.now();
    const path3 = req.path;
    let capturedJsonResponse = void 0;
    const originalResJson = res.json;
    res.json = function(bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
    res.on("finish", () => {
      if (!path3.startsWith("/api")) return;
      const duration = Date.now() - start;
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    });
    next();
  });
}
function getAppName() {
  return "Uni-Learn App";
}
function serveExpoManifest(platform, res) {
  const manifestPath = path2.resolve(
    process.cwd(),
    "static-build",
    platform,
    "manifest.json"
  );
  if (!fs2.existsSync(manifestPath)) {
    return res.status(404).json({ error: `Manifest not found for platform: ${platform}` });
  }
  res.setHeader("expo-protocol-version", "1");
  res.setHeader("expo-sfv-version", "0");
  res.setHeader("content-type", "application/json");
  const manifest = fs2.readFileSync(manifestPath, "utf-8");
  res.send(manifest);
}
function serveLandingPage({
  req,
  res,
  landingPageTemplate,
  appName
}) {
  const forwardedProto = req.header("x-forwarded-proto");
  const protocol = forwardedProto || req.protocol || "https";
  const forwardedHost = req.header("x-forwarded-host");
  const host = forwardedHost || req.get("host");
  const baseUrl = `${protocol}://${host}`;
  const expsUrl = `${host}`;
  log(`baseUrl`, baseUrl);
  log(`expsUrl`, expsUrl);
  const html = landingPageTemplate.replace(/BASE_URL_PLACEHOLDER/g, baseUrl).replace(/EXPS_URL_PLACEHOLDER/g, expsUrl).replace(/APP_NAME_PLACEHOLDER/g, appName);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}
function configureExpoAndLanding(app2) {
  const templatePath = path2.resolve(
    process.cwd(),
    "server",
    "templates",
    "landing-page.html"
  );
  const landingPageTemplate = fs2.readFileSync(templatePath, "utf-8");
  const appName = getAppName();
  log("Serving static Expo files with dynamic manifest routing");
  app2.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    if (req.path !== "/" && req.path !== "/manifest") {
      return next();
    }
    const platform = req.header("expo-platform");
    if (platform && (platform === "ios" || platform === "android")) {
      return serveExpoManifest(platform, res);
    }
    if (req.path === "/") {
      return serveLandingPage({
        req,
        res,
        landingPageTemplate,
        appName
      });
    }
    next();
  });
  app2.use("/assets", express.static(path2.resolve(process.cwd(), "assets")));
  app2.use(express.static(path2.resolve(process.cwd(), "static-build")));
  log("Expo routing: Checking expo-platform header on / and /manifest");
}
function setupSocketIO(httpServer) {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  io.on("connection", (socket) => {
    log(`Socket connected: ${socket.id}`);
    socket.on("join-live-class", async (data) => {
      try {
        const session = await db.select().from(liveSessions).where(eq2(liveSessions.id, data.sessionId)).limit(1);
        if (session.length === 0 || session[0].isLive === 0) {
          console.log(`Session ${data.sessionId} is ended, rejecting join request`);
          socket.emit("session-ended", { sessionId: data.sessionId });
          return;
        }
        socket.join(data.sessionId);
        socket.to(data.sessionId).emit("user-joined", { userId: data.userId || socket.id, name: data.name });
      } catch (error) {
        console.error("Error checking session status:", error);
      }
    });
    socket.on("leave-live-class", (data) => {
      socket.leave(data.sessionId);
      socket.to(data.sessionId).emit("user-left", { userId: data.userId || socket.id });
    });
    socket.on("send-message", (data) => {
      socket.to(data.sessionId).emit("new-message", data);
    });
    socket.on("share-document", (data) => {
      socket.to(data.sessionId).emit("document-shared", data);
    });
    socket.on("document-page-update", (data) => {
      socket.to(data.sessionId).emit("document-page-update", data);
    });
    socket.on("document-annotations-update", (data) => {
      socket.to(data.sessionId).emit("document-annotations-update", data);
    });
    socket.on("document-tool-update", (data) => {
      socket.to(data.sessionId).emit("document-tool-update", data);
    });
    socket.on("document-current-path-update", (data) => {
      socket.to(data.sessionId).emit("document-current-path-update", data);
    });
    socket.on("document-scroll-update", (data) => {
      socket.to(data.sessionId).emit("document-scroll-update", data);
    });
    socket.on("share-note", (data) => {
      socket.to(data.sessionId).emit("note-shared", data);
    });
    socket.on("session-started", (data) => {
      io.emit("session-started", data);
    });
    socket.on("webrtc-offer", (data) => {
      socket.to(data.sessionId).emit("webrtc-offer", data);
    });
    socket.on("webrtc-answer", (data) => {
      socket.to(data.sessionId).emit("webrtc-answer", data);
    });
    socket.on("webrtc-ice-candidate", (data) => {
      socket.to(data.sessionId).emit("webrtc-ice-candidate", data);
    });
    socket.on("disconnect", () => {
      log(`Socket disconnected: ${socket.id}`);
    });
  });
  return io;
}
async function runMigrations() {
  try {
    log("Running database migrations...");
    try {
      await db.$client.exec(`ALTER TABLE live_sessions ADD COLUMN "lecturerName" text`);
    } catch (e) {
    }
    try {
      await db.$client.exec(`ALTER TABLE live_sessions ADD COLUMN "currentDocument" text`);
    } catch (e) {
    }
    try {
      await db.$client.exec(`ALTER TABLE live_sessions ADD COLUMN "currentPage" integer DEFAULT 1`);
    } catch (e) {
    }
    try {
      await db.$client.exec(`ALTER TABLE live_sessions ADD COLUMN "annotations" text`);
    } catch (e) {
    }
    try {
      await db.$client.exec(`ALTER TABLE live_sessions ADD COLUMN "currentTool" text DEFAULT 'draw'`);
    } catch (e) {
    }
    try {
      await db.$client.exec(`ALTER TABLE lecturer_materials ADD COLUMN "isDeleted" integer DEFAULT 0`);
    } catch (e) {
    }
    try {
      await db.$client.exec(`ALTER TABLE lecturer_materials ADD COLUMN "size" integer`);
    } catch (e) {
    }
    await db.$client.exec(`
      CREATE INDEX IF NOT EXISTS idx_lecturer_materials_lecturer_id_is_deleted
      ON lecturer_materials ("lecturerId", "isDeleted")
    `);
    await db.$client.exec(`
      CREATE TABLE IF NOT EXISTS deleted_materials (
        id text PRIMARY KEY,
        "originalId" text NOT NULL,
        "lecturerId" text,
        "courseId" text,
        title text NOT NULL,
        description text,
        "fileUrl" text,
        "fileType" text,
        content text,
        size integer,
        "createdAt" integer DEFAULT (strftime('%s', 'now')),
        "deletedAt" integer DEFAULT (strftime('%s', 'now'))
      )
    `);
    log("Migrations completed successfully");
  } catch (error) {
    log("Migration error:", error);
  }
}
function setupErrorHandler(app2) {
  app2.use((err, _req, res, _next) => {
    const error = err;
    const status = error.status || error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
}
(async () => {
  setupCors(app);
  setupBodyParsing(app);
  setupRequestLogging(app);
  configureExpoAndLanding(app);
  await runMigrations();
  const httpServer = createServer2(app);
  const io = setupSocketIO(httpServer);
  const { server, processPaymentRetries } = await registerRoutes(app, httpServer, io);
  setupErrorHandler(app);
  const port = parseInt(process.env.PORT || "5001", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0"
    },
    () => {
      log(`express server with socket.io serving on port ${port}`);
      setInterval(() => {
        processPaymentRetries().catch((error) => {
          console.error("Error in payment retry processor:", error);
        });
      }, 60 * 1e3);
      log("Payment retry processor started");
    }
  );
})();
