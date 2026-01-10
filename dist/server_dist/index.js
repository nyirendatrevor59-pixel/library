"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server/index.ts
var import_express = __toESM(require("express"));

// server/routes.ts
var import_node_http = require("node:http");

// server/storage.ts
var import_better_sqlite3 = require("drizzle-orm/better-sqlite3");
var import_better_sqlite32 = __toESM(require("better-sqlite3"));

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
var import_sqlite_core = require("drizzle-orm/sqlite-core");
var import_drizzle_orm = require("drizzle-orm");
var import_zod = require("zod");
var users = (0, import_sqlite_core.sqliteTable)("users", {
  id: (0, import_sqlite_core.text)("id").primaryKey(),
  username: (0, import_sqlite_core.text)("username").notNull().unique(),
  email: (0, import_sqlite_core.text)("email").notNull().unique(),
  password: (0, import_sqlite_core.text)("password").notNull(),
  role: (0, import_sqlite_core.text)("role").notNull().default("student"),
  // student, lecturer, tutor, admin
  name: (0, import_sqlite_core.text)("name").notNull(),
  selectedCourses: (0, import_sqlite_core.text)("selectedCourses").default("[]"),
  // JSON string
  createdAt: (0, import_sqlite_core.integer)("createdAt").default(import_drizzle_orm.sql`(unixepoch())`)
});
var courses = (0, import_sqlite_core.sqliteTable)("courses", {
  id: (0, import_sqlite_core.text)("id").primaryKey(),
  name: (0, import_sqlite_core.text)("name").notNull(),
  code: (0, import_sqlite_core.text)("code").notNull().unique(),
  category: (0, import_sqlite_core.text)("category").notNull(),
  description: (0, import_sqlite_core.text)("description"),
  lecturerId: (0, import_sqlite_core.text)("lecturerId").references(() => users.id),
  lecturerName: (0, import_sqlite_core.text)("lecturerName"),
  createdAt: (0, import_sqlite_core.integer)("createdAt").default(import_drizzle_orm.sql`(unixepoch())`)
});
var liveSessions = (0, import_sqlite_core.sqliteTable)("live_sessions", {
  id: (0, import_sqlite_core.text)("id").primaryKey(),
  courseId: (0, import_sqlite_core.text)("courseId").references(() => courses.id),
  lecturerId: (0, import_sqlite_core.text)("lecturerId").references(() => users.id),
  lecturerName: (0, import_sqlite_core.text)("lecturerName"),
  topic: (0, import_sqlite_core.text)("topic").notNull(),
  scheduledTime: (0, import_sqlite_core.integer)("scheduledTime"),
  startTime: (0, import_sqlite_core.integer)("startTime"),
  endTime: (0, import_sqlite_core.integer)("endTime"),
  isLive: (0, import_sqlite_core.integer)("isLive").default(0),
  participants: (0, import_sqlite_core.integer)("participants").default(0),
  settings: (0, import_sqlite_core.text)("settings"),
  // JSON string
  currentDocument: (0, import_sqlite_core.text)("currentDocument"),
  // JSON string: { id, title, url }
  currentPage: (0, import_sqlite_core.integer)("currentPage").default(1),
  annotations: (0, import_sqlite_core.text)("annotations"),
  // JSON string
  currentTool: (0, import_sqlite_core.text)("currentTool").default("draw"),
  createdAt: (0, import_sqlite_core.integer)("createdAt").default(import_drizzle_orm.sql`(unixepoch())`)
});
var chatMessages = (0, import_sqlite_core.sqliteTable)("chat_messages", {
  id: (0, import_sqlite_core.text)("id").primaryKey(),
  sessionId: (0, import_sqlite_core.text)("sessionId").references(() => liveSessions.id),
  userId: (0, import_sqlite_core.text)("userId").references(() => users.id),
  message: (0, import_sqlite_core.text)("message").notNull(),
  timestamp: (0, import_sqlite_core.integer)("timestamp").default(import_drizzle_orm.sql`(unixepoch())`)
});
var sharedDocuments = (0, import_sqlite_core.sqliteTable)("shared_documents", {
  id: (0, import_sqlite_core.text)("id").primaryKey(),
  sessionId: (0, import_sqlite_core.text)("sessionId").references(() => liveSessions.id),
  userId: (0, import_sqlite_core.text)("userId").references(() => users.id),
  title: (0, import_sqlite_core.text)("title").notNull(),
  fileUrl: (0, import_sqlite_core.text)("fileUrl").notNull(),
  fileType: (0, import_sqlite_core.text)("fileType").notNull(),
  // pdf, doc, docx
  annotations: (0, import_sqlite_core.text)("annotations"),
  // JSON string
  sharedAt: (0, import_sqlite_core.integer)("sharedAt").default(import_drizzle_orm.sql`(unixepoch())`)
});
var lecturerMaterials = (0, import_sqlite_core.sqliteTable)("lecturer_materials", {
  id: (0, import_sqlite_core.text)("id").primaryKey(),
  lecturerId: (0, import_sqlite_core.text)("lecturerId").references(() => users.id),
  courseId: (0, import_sqlite_core.text)("courseId").references(() => courses.id),
  title: (0, import_sqlite_core.text)("title").notNull(),
  description: (0, import_sqlite_core.text)("description"),
  fileUrl: (0, import_sqlite_core.text)("fileUrl"),
  fileType: (0, import_sqlite_core.text)("fileType"),
  // pdf, doc, docx, link
  content: (0, import_sqlite_core.text)("content"),
  // For text content or link
  size: (0, import_sqlite_core.integer)("size"),
  // File size in bytes
  createdAt: (0, import_sqlite_core.integer)("createdAt").default(import_drizzle_orm.sql`(unixepoch())`),
  isDeleted: (0, import_sqlite_core.integer)("isDeleted").default(0)
});
var tutorRequests = (0, import_sqlite_core.sqliteTable)("tutor_requests", {
  id: (0, import_sqlite_core.text)("id").primaryKey(),
  studentId: (0, import_sqlite_core.text)("studentId").references(() => users.id),
  courseId: (0, import_sqlite_core.text)("courseId").references(() => courses.id),
  type: (0, import_sqlite_core.text)("type").notNull(),
  // topic_help, question, assignment_help
  title: (0, import_sqlite_core.text)("title").notNull(),
  description: (0, import_sqlite_core.text)("description"),
  messages: (0, import_sqlite_core.text)("messages"),
  // JSON string for conversation history
  response: (0, import_sqlite_core.text)("response"),
  // Tutor's response to the request
  status: (0, import_sqlite_core.text)("status").default("pending"),
  // pending, answered, resolved
  createdAt: (0, import_sqlite_core.integer)("createdAt").default(import_drizzle_orm.sql`(unixepoch())`),
  updatedAt: (0, import_sqlite_core.integer)("updatedAt").default(import_drizzle_orm.sql`(unixepoch())`)
});
var deletedMaterials = (0, import_sqlite_core.sqliteTable)("deleted_materials", {
  id: (0, import_sqlite_core.text)("id").primaryKey(),
  originalId: (0, import_sqlite_core.text)("originalId").notNull(),
  lecturerId: (0, import_sqlite_core.text)("lecturerId").references(() => users.id),
  courseId: (0, import_sqlite_core.text)("courseId").references(() => courses.id),
  title: (0, import_sqlite_core.text)("title").notNull(),
  description: (0, import_sqlite_core.text)("description"),
  fileUrl: (0, import_sqlite_core.text)("fileUrl"),
  fileType: (0, import_sqlite_core.text)("fileType"),
  // pdf, doc, docx, link
  content: (0, import_sqlite_core.text)("content"),
  // For text content or link
  size: (0, import_sqlite_core.integer)("size"),
  // File size in bytes
  createdAt: (0, import_sqlite_core.integer)("createdAt").default(import_drizzle_orm.sql`(unixepoch())`),
  deletedAt: (0, import_sqlite_core.integer)("deletedAt").default(import_drizzle_orm.sql`(unixepoch())`)
});
var supportRequests = (0, import_sqlite_core.sqliteTable)("support_requests", {
  id: (0, import_sqlite_core.text)("id").primaryKey(),
  userId: (0, import_sqlite_core.text)("userId").references(() => users.id),
  type: (0, import_sqlite_core.text)("type").notNull(),
  // password_reset, account_issue, technical_problem, other
  title: (0, import_sqlite_core.text)("title").notNull(),
  description: (0, import_sqlite_core.text)("description"),
  status: (0, import_sqlite_core.text)("status").default("open"),
  // open, in_progress, resolved, closed
  assignedTo: (0, import_sqlite_core.text)("assignedTo").references(() => users.id),
  // admin/tutor handling it
  createdAt: (0, import_sqlite_core.integer)("createdAt").default(import_drizzle_orm.sql`(unixepoch())`),
  updatedAt: (0, import_sqlite_core.integer)("updatedAt").default(import_drizzle_orm.sql`(unixepoch())`)
});
var userAnalytics = (0, import_sqlite_core.sqliteTable)("user_analytics", {
  id: (0, import_sqlite_core.text)("id").primaryKey(),
  userId: (0, import_sqlite_core.text)("userId").references(() => users.id),
  metric: (0, import_sqlite_core.text)("metric").notNull(),
  // sessions_attended, documents_viewed, messages_sent, etc.
  value: (0, import_sqlite_core.integer)("value").notNull(),
  date: (0, import_sqlite_core.integer)("date").default(import_drizzle_orm.sql`(unixepoch())`)
  // unix timestamp
});
var userTutors = (0, import_sqlite_core.sqliteTable)("user_tutors", {
  id: (0, import_sqlite_core.text)("id").primaryKey(),
  studentId: (0, import_sqlite_core.text)("studentId").references(() => users.id),
  tutorId: (0, import_sqlite_core.text)("tutorId").references(() => users.id),
  courseId: (0, import_sqlite_core.text)("courseId").references(() => courses.id),
  assignedBy: (0, import_sqlite_core.text)("assignedBy").references(() => users.id),
  // who assigned
  assignedAt: (0, import_sqlite_core.integer)("assignedAt").default(import_drizzle_orm.sql`(unixepoch())`),
  status: (0, import_sqlite_core.text)("status").default("active")
  // active, inactive
});
var subscriptionPlans = (0, import_sqlite_core.sqliteTable)("subscription_plans", {
  id: (0, import_sqlite_core.text)("id").primaryKey(),
  name: (0, import_sqlite_core.text)("name").notNull(),
  description: (0, import_sqlite_core.text)("description"),
  price: (0, import_sqlite_core.integer)("price").notNull(),
  // Price in cents
  currency: (0, import_sqlite_core.text)("currency").notNull().default("USD"),
  duration: (0, import_sqlite_core.integer)("duration").notNull(),
  // Duration in days
  features: (0, import_sqlite_core.text)("features"),
  // JSON string
  isActive: (0, import_sqlite_core.integer)("isActive").default(1),
  createdAt: (0, import_sqlite_core.integer)("createdAt").default(import_drizzle_orm.sql`(unixepoch())`)
});
var userSubscriptions = (0, import_sqlite_core.sqliteTable)("user_subscriptions", {
  id: (0, import_sqlite_core.text)("id").primaryKey(),
  userId: (0, import_sqlite_core.text)("userId").references(() => users.id),
  planId: (0, import_sqlite_core.text)("planId").references(() => subscriptionPlans.id),
  status: (0, import_sqlite_core.text)("status").notNull().default("active"),
  // active, cancelled, expired, paused
  startDate: (0, import_sqlite_core.integer)("startDate").notNull(),
  endDate: (0, import_sqlite_core.integer)("endDate").notNull(),
  autoRenew: (0, import_sqlite_core.integer)("autoRenew").default(1),
  // boolean
  createdAt: (0, import_sqlite_core.integer)("createdAt").default(import_drizzle_orm.sql`(unixepoch())`),
  updatedAt: (0, import_sqlite_core.integer)("updatedAt").default(import_drizzle_orm.sql`(unixepoch())`)
});
var payments = (0, import_sqlite_core.sqliteTable)("payments", {
  id: (0, import_sqlite_core.text)("id").primaryKey(),
  userId: (0, import_sqlite_core.text)("userId").references(() => users.id),
  subscriptionId: (0, import_sqlite_core.text)("subscriptionId").references(() => userSubscriptions.id),
  // nullable
  amount: (0, import_sqlite_core.integer)("amount").notNull(),
  // Amount in cents
  currency: (0, import_sqlite_core.text)("currency").notNull().default("USD"),
  status: (0, import_sqlite_core.text)("status").notNull().default("pending"),
  // pending, processing, completed, failed, refunded, retrying, otp_required
  paymentMethod: (0, import_sqlite_core.text)("paymentMethod").notNull(),
  // card, mpesa, airtel, paypal, etc.
  transactionId: (0, import_sqlite_core.text)("transactionId"),
  // External payment provider ID
  description: (0, import_sqlite_core.text)("description"),
  retryCount: (0, import_sqlite_core.integer)("retryCount").default(0),
  nextRetryAt: (0, import_sqlite_core.integer)("nextRetryAt"),
  maxRetries: (0, import_sqlite_core.integer)("maxRetries").default(5),
  // Mobile payment specific fields
  mobileProvider: (0, import_sqlite_core.text)("mobileProvider"),
  // mpesa, airtel, etc.
  mobileNumber: (0, import_sqlite_core.text)("mobileNumber"),
  // Phone number for mobile payments
  otpRequired: (0, import_sqlite_core.integer)("otpRequired").default(0),
  // Boolean flag for OTP requirement
  otpVerified: (0, import_sqlite_core.integer)("otpVerified").default(0),
  // Boolean flag for OTP verification status
  otpId: (0, import_sqlite_core.text)("otpId"),
  // OTP verification ID from provider
  otpExpiresAt: (0, import_sqlite_core.integer)("otpExpiresAt"),
  // OTP expiration timestamp
  createdAt: (0, import_sqlite_core.integer)("createdAt").default(import_drizzle_orm.sql`(unixepoch())`),
  updatedAt: (0, import_sqlite_core.integer)("updatedAt").default(import_drizzle_orm.sql`(unixepoch())`)
});
var paymentMethods = (0, import_sqlite_core.sqliteTable)("payment_methods", {
  id: (0, import_sqlite_core.text)("id").primaryKey(),
  userId: (0, import_sqlite_core.text)("userId").references(() => users.id),
  type: (0, import_sqlite_core.text)("type").notNull(),
  // card, paypal, bank_transfer
  provider: (0, import_sqlite_core.text)("provider").notNull(),
  // stripe, paypal, etc.
  last4: (0, import_sqlite_core.text)("last4"),
  // Last 4 digits for cards
  expiryMonth: (0, import_sqlite_core.integer)("expiryMonth"),
  expiryYear: (0, import_sqlite_core.integer)("expiryYear"),
  isDefault: (0, import_sqlite_core.integer)("isDefault").default(0),
  // boolean
  createdAt: (0, import_sqlite_core.integer)("createdAt").default(import_drizzle_orm.sql`(unixepoch())`)
});
var notifications = (0, import_sqlite_core.sqliteTable)("notifications", {
  id: (0, import_sqlite_core.text)("id").primaryKey(),
  userId: (0, import_sqlite_core.text)("userId").references(() => users.id),
  type: (0, import_sqlite_core.text)("type").notNull(),
  // payment_failed, payment_retry, payment_success, otp_sent
  title: (0, import_sqlite_core.text)("title").notNull(),
  message: (0, import_sqlite_core.text)("message").notNull(),
  data: (0, import_sqlite_core.text)("data"),
  // JSON string for additional data
  isRead: (0, import_sqlite_core.integer)("isRead").default(0),
  createdAt: (0, import_sqlite_core.integer)("createdAt").default(import_drizzle_orm.sql`(unixepoch())`)
});
var otpVerifications = (0, import_sqlite_core.sqliteTable)("otp_verifications", {
  id: (0, import_sqlite_core.text)("id").primaryKey(),
  paymentId: (0, import_sqlite_core.text)("paymentId").references(() => payments.id),
  otpCode: (0, import_sqlite_core.text)("otpCode").notNull(),
  // Hashed OTP code
  phoneNumber: (0, import_sqlite_core.text)("phoneNumber").notNull(),
  provider: (0, import_sqlite_core.text)("provider").notNull(),
  // mpesa, airtel, etc.
  status: (0, import_sqlite_core.text)("status").notNull().default("pending"),
  // pending, verified, expired, failed
  attempts: (0, import_sqlite_core.integer)("attempts").default(0),
  maxAttempts: (0, import_sqlite_core.integer)("maxAttempts").default(3),
  expiresAt: (0, import_sqlite_core.integer)("expiresAt").notNull(),
  verifiedAt: (0, import_sqlite_core.integer)("verifiedAt"),
  createdAt: (0, import_sqlite_core.integer)("createdAt").default(import_drizzle_orm.sql`(unixepoch())`)
});
var mobilePaymentProviders = (0, import_sqlite_core.sqliteTable)("mobile_payment_providers", {
  id: (0, import_sqlite_core.text)("id").primaryKey(),
  name: (0, import_sqlite_core.text)("name").notNull(),
  // mpesa, airtel, zamtel, etc.
  displayName: (0, import_sqlite_core.text)("displayName").notNull(),
  country: (0, import_sqlite_core.text)("country").notNull(),
  // ZM, KE, TZ, etc.
  currency: (0, import_sqlite_core.text)("currency").notNull(),
  // ZMW, KES, TZS, etc.
  minAmount: (0, import_sqlite_core.integer)("minAmount").notNull(),
  // Minimum amount in cents
  maxAmount: (0, import_sqlite_core.integer)("maxAmount").notNull(),
  // Maximum amount in cents
  isActive: (0, import_sqlite_core.integer)("isActive").default(1),
  apiEndpoint: (0, import_sqlite_core.text)("apiEndpoint"),
  // For production API
  apiKey: (0, import_sqlite_core.text)("apiKey"),
  // Encrypted API key
  apiSecret: (0, import_sqlite_core.text)("apiSecret"),
  // Encrypted API secret
  webhookUrl: (0, import_sqlite_core.text)("webhookUrl"),
  createdAt: (0, import_sqlite_core.integer)("createdAt").default(import_drizzle_orm.sql`(unixepoch())`),
  updatedAt: (0, import_sqlite_core.integer)("updatedAt").default(import_drizzle_orm.sql`(unixepoch())`)
});
var insertUserSchema = import_zod.z.object({
  username: import_zod.z.string(),
  email: import_zod.z.string(),
  password: import_zod.z.string(),
  role: import_zod.z.string().optional().default("student"),
  name: import_zod.z.string()
});
var insertCourseSchema = import_zod.z.object({
  name: import_zod.z.string(),
  code: import_zod.z.string(),
  category: import_zod.z.string(),
  description: import_zod.z.string().optional(),
  lecturerId: import_zod.z.string().optional()
});
var insertLiveSessionSchema = import_zod.z.object({
  courseId: import_zod.z.string(),
  lecturerId: import_zod.z.string(),
  topic: import_zod.z.string(),
  scheduledTime: import_zod.z.number().optional()
});
var insertChatMessageSchema = import_zod.z.object({
  sessionId: import_zod.z.string(),
  userId: import_zod.z.string(),
  message: import_zod.z.string()
});
var insertSharedDocumentSchema = import_zod.z.object({
  sessionId: import_zod.z.string(),
  userId: import_zod.z.string(),
  title: import_zod.z.string(),
  fileUrl: import_zod.z.string(),
  fileType: import_zod.z.string()
});
var insertLecturerMaterialSchema = import_zod.z.object({
  lecturerId: import_zod.z.string(),
  courseId: import_zod.z.string(),
  title: import_zod.z.string(),
  description: import_zod.z.string().optional(),
  fileUrl: import_zod.z.string().optional(),
  fileType: import_zod.z.string().optional(),
  content: import_zod.z.string().optional(),
  size: import_zod.z.number().optional()
});
var insertTutorRequestSchema = import_zod.z.object({
  studentId: import_zod.z.string(),
  courseId: import_zod.z.string(),
  type: import_zod.z.string(),
  title: import_zod.z.string(),
  description: import_zod.z.string().optional(),
  messages: import_zod.z.string().optional()
});
var insertDeletedMaterialSchema = import_zod.z.object({
  originalId: import_zod.z.string(),
  lecturerId: import_zod.z.string(),
  courseId: import_zod.z.string(),
  title: import_zod.z.string(),
  description: import_zod.z.string().optional(),
  fileUrl: import_zod.z.string().optional(),
  fileType: import_zod.z.string().optional(),
  content: import_zod.z.string().optional(),
  size: import_zod.z.number().optional()
});
var insertSupportRequestSchema = import_zod.z.object({
  userId: import_zod.z.string(),
  type: import_zod.z.string(),
  title: import_zod.z.string(),
  description: import_zod.z.string().optional()
});
var insertUserAnalyticsSchema = import_zod.z.object({
  userId: import_zod.z.string(),
  metric: import_zod.z.string(),
  value: import_zod.z.number(),
  date: import_zod.z.number().optional()
});
var insertUserTutorSchema = import_zod.z.object({
  studentId: import_zod.z.string(),
  tutorId: import_zod.z.string(),
  courseId: import_zod.z.string(),
  assignedBy: import_zod.z.string()
});
var insertSubscriptionPlanSchema = import_zod.z.object({
  name: import_zod.z.string(),
  description: import_zod.z.string().optional(),
  price: import_zod.z.number(),
  currency: import_zod.z.string().optional().default("USD"),
  duration: import_zod.z.number(),
  features: import_zod.z.string().optional(),
  isActive: import_zod.z.number().optional().default(1)
});
var insertUserSubscriptionSchema = import_zod.z.object({
  userId: import_zod.z.string(),
  planId: import_zod.z.string(),
  status: import_zod.z.string().optional().default("active"),
  startDate: import_zod.z.number(),
  endDate: import_zod.z.number(),
  autoRenew: import_zod.z.number().optional().default(1)
});
var insertPaymentSchema = import_zod.z.object({
  userId: import_zod.z.string(),
  subscriptionId: import_zod.z.string().optional(),
  amount: import_zod.z.number(),
  currency: import_zod.z.string().optional().default("USD"),
  status: import_zod.z.string().optional().default("pending"),
  paymentMethod: import_zod.z.string(),
  transactionId: import_zod.z.string().optional(),
  description: import_zod.z.string().optional()
});
var insertPaymentMethodSchema = import_zod.z.object({
  userId: import_zod.z.string(),
  type: import_zod.z.string(),
  provider: import_zod.z.string(),
  last4: import_zod.z.string().optional(),
  expiryMonth: import_zod.z.number().optional(),
  expiryYear: import_zod.z.number().optional(),
  isDefault: import_zod.z.number().optional().default(0)
});
var insertOtpVerificationSchema = import_zod.z.object({
  paymentId: import_zod.z.string().optional(),
  otpCode: import_zod.z.string(),
  phoneNumber: import_zod.z.string(),
  provider: import_zod.z.string(),
  status: import_zod.z.string().optional().default("pending"),
  attempts: import_zod.z.number().optional().default(0),
  maxAttempts: import_zod.z.number().optional().default(3),
  expiresAt: import_zod.z.number(),
  verifiedAt: import_zod.z.number().optional()
});
var insertMobilePaymentProviderSchema = import_zod.z.object({
  name: import_zod.z.string(),
  displayName: import_zod.z.string(),
  country: import_zod.z.string(),
  currency: import_zod.z.string(),
  minAmount: import_zod.z.number(),
  maxAmount: import_zod.z.number(),
  isActive: import_zod.z.number().optional().default(1),
  apiEndpoint: import_zod.z.string().optional(),
  apiKey: import_zod.z.string().optional(),
  apiSecret: import_zod.z.string().optional(),
  webhookUrl: import_zod.z.string().optional()
});

// server/storage.ts
var sqlite = new import_better_sqlite32.default("database.db");
sqlite.pragma("foreign_keys = ON");
var db = (0, import_better_sqlite3.drizzle)(sqlite, { schema: schema_exports });

// server/routes.ts
var import_drizzle_orm2 = require("drizzle-orm");
var import_jsonwebtoken = __toESM(require("jsonwebtoken"));
var import_multer = __toESM(require("multer"));
var import_crypto = require("crypto");
var import_stripe = __toESM(require("stripe"));
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
    const lecturerUser = await db.select().from(users).where((0, import_drizzle_orm2.eq)(users.role, "lecturer")).limit(1);
    const lecturerId = lecturerUser.length > 0 ? lecturerUser[0].id : null;
    for (const course of SAMPLE_COURSES) {
      const existing = await db.select().from(courses).where((0, import_drizzle_orm2.eq)(courses.id, course.id)).limit(1);
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
          await db.update(courses).set({ lecturerId }).where((0, import_drizzle_orm2.eq)(courses.id, course.id));
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
      const existing = await db.select().from(users).where((0, import_drizzle_orm2.eq)(users.email, user.email)).limit(1);
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
    const lecturerUser = await db.select().from(users).where((0, import_drizzle_orm2.eq)(users.role, "lecturer")).limit(1);
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
      const existing = await db.select().from(lecturerMaterials).where((0, import_drizzle_orm2.eq)(lecturerMaterials.title, material.title)).limit(1);
      if (existing.length === 0) {
        const newMaterial = await db.insert(lecturerMaterials).values({
          id: (0, import_crypto.randomUUID)(),
          ...material
        }).returning();
        const fileUrl = `/api/files/${newMaterial[0].id}`;
        await db.update(lecturerMaterials).set({ fileUrl }).where((0, import_drizzle_orm2.eq)(lecturerMaterials.id, newMaterial[0].id));
      }
    }
    console.log("Materials seeded");
  } catch (error) {
    console.error("Error seeding materials:", error);
  }
}
async function seedTutorAssignments() {
  try {
    const studentUser = await db.select().from(users).where((0, import_drizzle_orm2.eq)(users.role, "student")).limit(1);
    const tutorUser = await db.select().from(users).where((0, import_drizzle_orm2.eq)(users.role, "tutor")).limit(1);
    const adminUser = await db.select().from(users).where((0, import_drizzle_orm2.eq)(users.role, "admin")).limit(1);
    if (!studentUser.length || !tutorUser.length || !adminUser.length) {
      console.log("Required users not found, skipping tutor assignment seeding");
      return;
    }
    const studentId = studentUser[0].id;
    const tutorId = tutorUser[0].id;
    const assignedBy = adminUser[0].id;
    const existing = await db.select().from(userTutors).where((0, import_drizzle_orm2.and)((0, import_drizzle_orm2.eq)(userTutors.studentId, studentId), (0, import_drizzle_orm2.eq)(userTutors.tutorId, tutorId))).limit(1);
    if (existing.length === 0) {
      await db.insert(userTutors).values({
        id: (0, import_crypto.randomUUID)(),
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
    const studentUser = await db.select().from(users).where((0, import_drizzle_orm2.eq)(users.role, "student")).limit(1);
    if (!studentUser.length) {
      console.log("No student user found, skipping tutor request seeding");
      return;
    }
    const studentId = studentUser[0].id;
    await db.insert(tutorRequests).values({
      id: (0, import_crypto.randomUUID)(),
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
    const lecturerUser = await db.select().from(users).where((0, import_drizzle_orm2.eq)(users.role, "lecturer")).limit(1);
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
    const existing = await db.select().from(liveSessions).where((0, import_drizzle_orm2.eq)(liveSessions.id, testSession.id)).limit(1);
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
      const existing = await db.select().from(subscriptionPlans).where((0, import_drizzle_orm2.eq)(subscriptionPlans.id, plan.id)).limit(1);
      if (existing.length === 0) {
        await db.insert(subscriptionPlans).values(plan);
      }
    }
    const studentUser = await db.select().from(users).where((0, import_drizzle_orm2.eq)(users.role, "student")).limit(1);
    if (studentUser.length > 0) {
      const studentId = studentUser[0].id;
      const existingSub = await db.select().from(userSubscriptions).where((0, import_drizzle_orm2.eq)(userSubscriptions.userId, studentId)).limit(1);
      if (existingSub.length === 0) {
        const now = Math.floor(Date.now() / 1e3);
        const endDate = now + 30 * 24 * 60 * 60;
        await db.insert(userSubscriptions).values({
          id: (0, import_crypto.randomUUID)(),
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
        const existing = await db.select().from(userAnalytics).where((0, import_drizzle_orm2.and)(
          (0, import_drizzle_orm2.eq)(userAnalytics.userId, data.userId),
          (0, import_drizzle_orm2.eq)(userAnalytics.metric, data.metric)
        )).limit(1);
        if (existing.length === 0) {
          await db.insert(userAnalytics).values({
            id: (0, import_crypto.randomUUID)(),
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
var fs = require("fs");
var path = require("path");
var materialsFile = path.join(__dirname, "uploadedMaterials.json");
var storage = import_multer.default.memoryStorage();
var upload = (0, import_multer.default)({
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
      id: (0, import_crypto.randomUUID)(),
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
  import_jsonwebtoken.default.verify(token, JWT_SECRET, (err, user) => {
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
    db.select().from(users).where((0, import_drizzle_orm2.eq)(users.id, req.user.userId)).limit(1).then((userResult) => {
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
    stripe = new import_stripe.default(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-12-15.clover"
    });
  }
  async function handlePaymentFailure(transactionId) {
    try {
      const payment = await db.select().from(payments).where((0, import_drizzle_orm2.eq)(payments.transactionId, transactionId)).limit(1);
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
        }).where((0, import_drizzle_orm2.eq)(payments.id, p.id));
        await createNotification(p.userId, "payment_failed", "Payment Failed", `Your payment of ${(p.amount / 100).toFixed(2)} has failed after ${maxRetries} attempts.`, { paymentId: p.id });
        const admins = await db.select().from(users).where((0, import_drizzle_orm2.eq)(users.role, "admin"));
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
      }).where((0, import_drizzle_orm2.eq)(payments.id, p.id));
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
        (0, import_drizzle_orm2.and)(
          (0, import_drizzle_orm2.eq)(payments.status, "retrying"),
          (0, import_drizzle_orm2.lte)(payments.nextRetryAt, now)
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
      }).where((0, import_drizzle_orm2.eq)(payments.id, payment.id));
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
      const userResult = await db.select().from(users).where((0, import_drizzle_orm2.eq)(users.email, email)).limit(1);
      if (userResult.length === 0 || userResult[0].password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const user = userResult[0];
      const token = import_jsonwebtoken.default.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
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
        (0, import_drizzle_orm2.eq)(users.email, email)
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
        id: (0, import_crypto.randomUUID)(),
        username,
        email,
        password: hashedPassword,
        name,
        role: requestedRole,
        selectedCourses: requestedRole === "student" ? '["1"]' : "[]"
      }).returning();
      const token = import_jsonwebtoken.default.sign({ userId: newUser[0].id }, JWT_SECRET, { expiresIn: "7d" });
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
        id: (0, import_crypto.randomUUID)(),
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
      const lecturer = await db.select().from(users).where((0, import_drizzle_orm2.eq)(users.id, lecturerId)).limit(1);
      if (lecturer.length === 0) {
        console.log("Lecturer not found:", lecturerId);
        return res.status(400).json({ error: "Lecturer not found" });
      }
      const existingLiveSession = await db.select().from(liveSessions).where((0, import_drizzle_orm2.and)((0, import_drizzle_orm2.eq)(liveSessions.lecturerId, lecturerId), (0, import_drizzle_orm2.eq)(liveSessions.isLive, 1))).limit(1);
      if (existingLiveSession.length > 0) {
        console.log("Lecturer already has a live session:", existingLiveSession[0].id);
        return res.status(400).json({ error: "You already have an active live session. Please end it before starting a new one." });
      }
      const course = await db.select().from(courses).where((0, import_drizzle_orm2.eq)(courses.id, courseId)).limit(1);
      if (course.length === 0) {
        console.log("Course not found:", courseId);
        return res.status(400).json({ error: "Course not found" });
      }
      const lecturerName = lecturer[0].name || lecturer[0].email.split("@")[0];
      const newSession = await db.insert(liveSessions).values({
        id: (0, import_crypto.randomUUID)(),
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
      const updatedSession = await db.update(liveSessions).set({ isLive: 0, endTime: Math.floor(Date.now() / 1e3) }).where((0, import_drizzle_orm2.eq)(liveSessions.id, id)).returning();
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
      await db.delete(liveSessions).where((0, import_drizzle_orm2.eq)(liveSessions.id, id));
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
      const updatedSession = await db.update(liveSessions).set(updateData).where((0, import_drizzle_orm2.eq)(liveSessions.id, id)).returning();
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
        (0, import_drizzle_orm2.eq)(chatMessages.sessionId, sessionId)
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
        id: (0, import_crypto.randomUUID)(),
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
        id: (0, import_crypto.randomUUID)(),
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
        const existingLecturers = await db.select().from(users).where((0, import_drizzle_orm2.and)((0, import_drizzle_orm2.inArray)(users.id, lecturerIds), (0, import_drizzle_orm2.eq)(users.role, "lecturer")));
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
      const conditions = [(0, import_drizzle_orm2.eq)(lecturerMaterials.isDeleted, 0)];
      if (lecturerIds.length > 0) {
        console.log("Building or condition with lecturerIds:", lecturerIds);
        conditions.push((0, import_drizzle_orm2.or)(
          (0, import_drizzle_orm2.inArray)(lecturerMaterials.lecturerId, lecturerIds),
          (0, import_drizzle_orm2.inArray)(courses.lecturerId, lecturerIds)
        ));
      }
      if (courseIds) {
        const courseIdArray = courseIds.split(",").filter((id) => id.trim());
        if (courseIdArray.length > 0) {
          conditions.push((0, import_drizzle_orm2.inArray)(lecturerMaterials.courseId, courseIdArray));
        }
      }
      const whereCondition = conditions.length > 1 ? (0, import_drizzle_orm2.and)(...conditions) : conditions[0];
      console.log("Querying materials with whereCondition:", whereCondition);
      const query = db.select(selectFields).from(lecturerMaterials).leftJoin(courses, (0, import_drizzle_orm2.eq)(lecturerMaterials.courseId, courses.id)).where(whereCondition).limit(limitNum).offset(offsetNum);
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
        id: (0, import_crypto.randomUUID)(),
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
        id: (0, import_crypto.randomUUID)(),
        userId: lecturerId,
        metric: "materials_uploaded",
        value: 1,
        date: Math.floor(Date.now() / 1e3)
      });
      if (req.file) {
        fileUrl = `/api/files/${newMaterial[0].id}`;
        console.log("Updating fileUrl...");
        await db.update(lecturerMaterials).set({ fileUrl }).where((0, import_drizzle_orm2.eq)(lecturerMaterials.id, newMaterial[0].id));
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
      const material = await db.select().from(lecturerMaterials).where((0, import_drizzle_orm2.and)((0, import_drizzle_orm2.eq)(lecturerMaterials.id, id), (0, import_drizzle_orm2.eq)(lecturerMaterials.isDeleted, 0))).limit(1);
      if (material.length === 0) {
        return res.status(404).json({ error: "Material not found" });
      }
      await db.insert(deletedMaterials).values({
        id: (0, import_crypto.randomUUID)(),
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
      await db.update(lecturerMaterials).set({ isDeleted: 1 }).where((0, import_drizzle_orm2.eq)(lecturerMaterials.id, id));
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
      const allMaterials = await db.select().from(lecturerMaterials).where((0, import_drizzle_orm2.eq)(lecturerMaterials.isDeleted, 0));
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
      const material = await db.select().from(lecturerMaterials).where((0, import_drizzle_orm2.and)((0, import_drizzle_orm2.eq)(lecturerMaterials.id, id), (0, import_drizzle_orm2.eq)(lecturerMaterials.isDeleted, 0))).limit(1);
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
      const user = await db.select().from(users).where((0, import_drizzle_orm2.eq)(users.id, userId)).limit(1);
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
        requests = await db.select().from(tutorRequests).where((0, import_drizzle_orm2.eq)(tutorRequests.studentId, studentId));
        console.log("Debug: requests assigned for studentId, length:", requests.length);
      } else {
        if (userRole === "student") {
          requests = await db.select().from(tutorRequests).where((0, import_drizzle_orm2.eq)(tutorRequests.studentId, userId));
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
        id: (0, import_crypto.randomUUID)(),
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
        const request = await db.select().from(tutorRequests).where((0, import_drizzle_orm2.eq)(tutorRequests.id, id)).limit(1);
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
      const updatedRequest = await db.update(tutorRequests).set(updateData).where((0, import_drizzle_orm2.eq)(tutorRequests.id, id)).returning();
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
      const request = await db.select().from(tutorRequests).where((0, import_drizzle_orm2.eq)(tutorRequests.id, id)).limit(1);
      if (request.length === 0 || request[0].studentId !== studentId) {
        return res.status(403).json({ error: "Access denied" });
      }
      await db.delete(tutorRequests).where((0, import_drizzle_orm2.eq)(tutorRequests.id, id));
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
      const request = await db.select().from(tutorRequests).where((0, import_drizzle_orm2.eq)(tutorRequests.id, id)).limit(1);
      if (request.length === 0) {
        return res.status(404).json({ error: "Request not found" });
      }
      const tutorRequest = request[0];
      if (userRole === "student" && tutorRequest.studentId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      if (userRole === "tutor") {
        const assignment = await db.select().from(userTutors).where((0, import_drizzle_orm2.and)((0, import_drizzle_orm2.eq)(userTutors.studentId, tutorRequest.studentId), (0, import_drizzle_orm2.eq)(userTutors.tutorId, userId))).limit(1);
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
      }).where((0, import_drizzle_orm2.eq)(tutorRequests.id, id)).returning();
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
      const existingUser = await db.select().from(users).where((0, import_drizzle_orm2.eq)(users.email, email)).limit(1);
      if (existingUser.length > 0) {
        return res.status(400).json({ error: "User already exists" });
      }
      const newUser = await db.insert(users).values({
        id: (0, import_crypto.randomUUID)(),
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
      const updatedUser = await db.update(users).set(updateData).where((0, import_drizzle_orm2.eq)(users.id, id)).returning();
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
      const courseRefs = await db.select().from(courses).where((0, import_drizzle_orm2.eq)(courses.lecturerId, id));
      if (courseRefs.length > 0) references.push(`courses (${courseRefs.length})`);
      const sessionRefs = await db.select().from(liveSessions).where((0, import_drizzle_orm2.eq)(liveSessions.lecturerId, id));
      if (sessionRefs.length > 0) references.push(`live sessions (${sessionRefs.length})`);
      const materialRefs = await db.select().from(lecturerMaterials).where((0, import_drizzle_orm2.eq)(lecturerMaterials.lecturerId, id));
      if (materialRefs.length > 0) references.push(`lecturer materials (${materialRefs.length})`);
      const tutorRefs = await db.select().from(userTutors).where((0, import_drizzle_orm2.or)((0, import_drizzle_orm2.eq)(userTutors.studentId, id), (0, import_drizzle_orm2.eq)(userTutors.tutorId, id), (0, import_drizzle_orm2.eq)(userTutors.assignedBy, id)));
      if (tutorRefs.length > 0) references.push(`tutor assignments (${tutorRefs.length})`);
      const supportRefs = await db.select().from(supportRequests).where((0, import_drizzle_orm2.or)((0, import_drizzle_orm2.eq)(supportRequests.userId, id), (0, import_drizzle_orm2.eq)(supportRequests.assignedTo, id)));
      if (supportRefs.length > 0) references.push(`support requests (${supportRefs.length})`);
      if (references.length > 0) {
        return res.status(400).json({
          error: `Cannot delete user because they are referenced in: ${references.join(", ")}. Please reassign or remove these references first.`
        });
      }
      await db.delete(users).where((0, import_drizzle_orm2.eq)(users.id, id));
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
      const updatedUser = await db.update(users).set({ password }).where((0, import_drizzle_orm2.eq)(users.id, id)).returning();
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
        id: (0, import_crypto.randomUUID)(),
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
      const updatedRequest = await db.update(supportRequests).set(updateData).where((0, import_drizzle_orm2.eq)(supportRequests.id, id)).returning();
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
        id: (0, import_crypto.randomUUID)(),
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
        totalRevenue: import_drizzle_orm2.sql`SUM(${payments.amount})`,
        totalTransactions: import_drizzle_orm2.sql`COUNT(*)`
      }).from(payments).where((0, import_drizzle_orm2.and)(
        (0, import_drizzle_orm2.eq)(payments.status, "completed"),
        (0, import_drizzle_orm2.gte)(payments.createdAt, startTimestamp),
        (0, import_drizzle_orm2.lte)(payments.createdAt, endTimestamp)
      ));
      const revenueByCurrency = await db.select({
        currency: payments.currency,
        revenue: import_drizzle_orm2.sql`SUM(${payments.amount})`,
        transactions: import_drizzle_orm2.sql`COUNT(*)`
      }).from(payments).where((0, import_drizzle_orm2.and)(
        (0, import_drizzle_orm2.eq)(payments.status, "completed"),
        (0, import_drizzle_orm2.gte)(payments.createdAt, startTimestamp),
        (0, import_drizzle_orm2.lte)(payments.createdAt, endTimestamp)
      )).groupBy(payments.currency);
      const revenueByMethod = await db.select({
        paymentMethod: payments.paymentMethod,
        revenue: import_drizzle_orm2.sql`SUM(${payments.amount})`,
        transactions: import_drizzle_orm2.sql`COUNT(*)`
      }).from(payments).where((0, import_drizzle_orm2.and)(
        (0, import_drizzle_orm2.eq)(payments.status, "completed"),
        (0, import_drizzle_orm2.gte)(payments.createdAt, startTimestamp),
        (0, import_drizzle_orm2.lte)(payments.createdAt, endTimestamp)
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
      }).from(payments).leftJoin(users, (0, import_drizzle_orm2.eq)(payments.userId, users.id)).orderBy(payments.createdAt).limit(50);
      const activeSubscriptions = await db.select({
        count: import_drizzle_orm2.sql`COUNT(*)`
      }).from(userSubscriptions).where((0, import_drizzle_orm2.eq)(userSubscriptions.status, "active"));
      const subscriptionRevenue = await db.select({
        revenue: import_drizzle_orm2.sql`SUM(${subscriptionPlans.price})`,
        subscriptions: import_drizzle_orm2.sql`COUNT(*)`
      }).from(userSubscriptions).leftJoin(subscriptionPlans, (0, import_drizzle_orm2.eq)(userSubscriptions.planId, subscriptionPlans.id)).where((0, import_drizzle_orm2.and)(
        (0, import_drizzle_orm2.eq)(userSubscriptions.status, "active"),
        (0, import_drizzle_orm2.gte)(userSubscriptions.createdAt, startTimestamp),
        (0, import_drizzle_orm2.lte)(userSubscriptions.createdAt, endTimestamp)
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
        conditions.push((0, import_drizzle_orm2.eq)(payments.status, status));
      }
      if (userId) {
        conditions.push((0, import_drizzle_orm2.eq)(payments.userId, userId));
      }
      if (startDate) {
        conditions.push((0, import_drizzle_orm2.gte)(payments.createdAt, Math.floor(new Date(startDate).getTime() / 1e3)));
      }
      if (endDate) {
        conditions.push((0, import_drizzle_orm2.lte)(payments.createdAt, Math.floor(new Date(endDate).getTime() / 1e3)));
      }
      const whereCondition = conditions.length > 0 ? (0, import_drizzle_orm2.and)(...conditions) : void 0;
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
      }).from(payments).leftJoin(users, (0, import_drizzle_orm2.eq)(payments.userId, users.id)).where(whereCondition).orderBy(payments.createdAt).limit(limitNum).offset(offsetNum);
      const totalResult = await db.select({
        count: import_drizzle_orm2.sql`COUNT(*)`
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
        count: import_drizzle_orm2.sql`COUNT(*)`
      }).from(userSubscriptions).where((0, import_drizzle_orm2.and)(
        (0, import_drizzle_orm2.gte)(userSubscriptions.createdAt, startTimestamp),
        (0, import_drizzle_orm2.lte)(userSubscriptions.createdAt, endTimestamp)
      )).groupBy(userSubscriptions.status);
      const popularPlans = await db.select({
        planId: subscriptionPlans.id,
        planName: subscriptionPlans.name,
        price: subscriptionPlans.price,
        currency: subscriptionPlans.currency,
        count: import_drizzle_orm2.sql`COUNT(*)`,
        revenue: import_drizzle_orm2.sql`SUM(${subscriptionPlans.price})`
      }).from(userSubscriptions).leftJoin(subscriptionPlans, (0, import_drizzle_orm2.eq)(userSubscriptions.planId, subscriptionPlans.id)).where((0, import_drizzle_orm2.and)(
        (0, import_drizzle_orm2.eq)(userSubscriptions.status, "active"),
        (0, import_drizzle_orm2.gte)(userSubscriptions.createdAt, startTimestamp),
        (0, import_drizzle_orm2.lte)(userSubscriptions.createdAt, endTimestamp)
      )).groupBy(subscriptionPlans.id, subscriptionPlans.name, subscriptionPlans.price, subscriptionPlans.currency).orderBy(import_drizzle_orm2.sql`COUNT(*) DESC`);
      const churnData = await db.select({
        status: userSubscriptions.status,
        count: import_drizzle_orm2.sql`COUNT(*)`
      }).from(userSubscriptions).where((0, import_drizzle_orm2.gte)(userSubscriptions.updatedAt, startTimestamp)).groupBy(userSubscriptions.status);
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
      }).from(userSubscriptions).where((0, import_drizzle_orm2.and)(
        (0, import_drizzle_orm2.eq)(userSubscriptions.status, "active"),
        (0, import_drizzle_orm2.lte)(userSubscriptions.endDate, now)
      ));
      if (overdueSubscriptions.length === 0) {
        return res.json([]);
      }
      const userIds = overdueSubscriptions.map((sub) => sub.userId).filter((id) => id !== null);
      const userDetails = await db.select({
        id: users.id,
        name: users.name,
        email: users.email
      }).from(users).where((0, import_drizzle_orm2.inArray)(users.id, userIds));
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
        count: import_drizzle_orm2.sql`COUNT(*)`
      }).from(users).groupBy(users.role);
      const registrationTrends = await db.select({
        date: import_drizzle_orm2.sql`DATE(${users.createdAt}, 'unixepoch')`,
        count: import_drizzle_orm2.sql`COUNT(*)`
      }).from(users).where((0, import_drizzle_orm2.and)(
        (0, import_drizzle_orm2.gte)(users.createdAt, startTimestamp),
        (0, import_drizzle_orm2.lte)(users.createdAt, endTimestamp)
      )).groupBy(import_drizzle_orm2.sql`DATE(${users.createdAt}, 'unixepoch')`).orderBy(import_drizzle_orm2.sql`DATE(${users.createdAt}, 'unixepoch')`);
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
        enrollmentCount: import_drizzle_orm2.sql`COUNT(DISTINCT ${userTutors.studentId})`
      }).from(courses).leftJoin(userTutors, (0, import_drizzle_orm2.eq)(courses.id, userTutors.courseId)).groupBy(courses.id, courses.name, courses.code, courses.lecturerName).orderBy(import_drizzle_orm2.sql`COUNT(DISTINCT ${userTutors.studentId}) DESC`).limit(10);
      const coursesByCategory = await db.select({
        category: courses.category,
        count: import_drizzle_orm2.sql`COUNT(*)`
      }).from(courses).groupBy(courses.category);
      const totalStats = await db.select({
        totalCourses: import_drizzle_orm2.sql`COUNT(DISTINCT ${courses.id})`,
        totalEnrollments: import_drizzle_orm2.sql`COUNT(DISTINCT ${userTutors.studentId})`,
        activeTutors: import_drizzle_orm2.sql`COUNT(DISTINCT ${userTutors.tutorId})`
      }).from(courses).leftJoin(userTutors, (0, import_drizzle_orm2.eq)(courses.id, userTutors.courseId)).where((0, import_drizzle_orm2.eq)(userTutors.status, "active"));
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
        count: import_drizzle_orm2.sql`COUNT(*)`
      }).from(supportRequests).where((0, import_drizzle_orm2.and)(
        (0, import_drizzle_orm2.gte)(supportRequests.createdAt, startTimestamp),
        (0, import_drizzle_orm2.lte)(supportRequests.createdAt, endTimestamp)
      )).groupBy(supportRequests.status);
      const requestsByType = await db.select({
        type: supportRequests.type,
        count: import_drizzle_orm2.sql`COUNT(*)`
      }).from(supportRequests).where((0, import_drizzle_orm2.and)(
        (0, import_drizzle_orm2.gte)(supportRequests.createdAt, startTimestamp),
        (0, import_drizzle_orm2.lte)(supportRequests.createdAt, endTimestamp)
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
      }).from(supportRequests).leftJoin(users, (0, import_drizzle_orm2.eq)(supportRequests.userId, users.id)).orderBy(supportRequests.createdAt).limit(5);
      const unresolvedCount = await db.select({
        count: import_drizzle_orm2.sql`COUNT(*)`
      }).from(supportRequests).where((0, import_drizzle_orm2.ne)(supportRequests.status, "resolved"));
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
        id: (0, import_crypto.randomUUID)(),
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
    const user = await db.select().from(users).where((0, import_drizzle_orm2.eq)(users.id, req.user.userId)).limit(1);
    if (user.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const userRole = user[0].role;
    const userId = req.user.userId;
    try {
      const { id } = req.params;
      const userId2 = req.user.userId;
      const userRole2 = req.userDetails.role;
      const assignment = await db.select().from(userTutors).where((0, import_drizzle_orm2.eq)(userTutors.id, id)).limit(1);
      if (assignment.length === 0) {
        return res.status(404).json({ error: "Assignment not found" });
      }
      if (userRole2 !== "admin" && !(userRole2 === "tutor" && assignment[0].tutorId === userId2)) {
        return res.status(403).json({ error: "Access denied" });
      }
      await db.delete(userTutors).where((0, import_drizzle_orm2.eq)(userTutors.id, id));
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
      }).from(userTutors).leftJoin(users, (0, import_drizzle_orm2.eq)(userTutors.tutorId, users.id)).leftJoin(courses, (0, import_drizzle_orm2.eq)(userTutors.courseId, courses.id)).where((0, import_drizzle_orm2.and)((0, import_drizzle_orm2.eq)(userTutors.studentId, studentId), (0, import_drizzle_orm2.eq)(userTutors.status, "active")));
      const debugRequests = await db.select().from(tutorRequests).where((0, import_drizzle_orm2.eq)(tutorRequests.studentId, studentId));
      console.log("All tutor requests for student", studentId, ":", debugRequests);
      const allRequests = await db.select().from(tutorRequests).where((0, import_drizzle_orm2.eq)(tutorRequests.studentId, studentId));
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
          id: (0, import_crypto.randomUUID)(),
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
        const payment = await db.select().from(payments).where((0, import_drizzle_orm2.and)(
          (0, import_drizzle_orm2.eq)(payments.id, paymentId),
          (0, import_drizzle_orm2.eq)(payments.userId, userId)
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
        }).where((0, import_drizzle_orm2.eq)(payments.id, paymentId));
        if (newStatus === "completed") {
          if (payment[0].subscriptionId) {
            await db.update(userSubscriptions).set({
              status: "active"
            }).where((0, import_drizzle_orm2.eq)(userSubscriptions.id, payment[0].subscriptionId));
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
            const paymentsToUpdate = await db.select().from(payments).where((0, import_drizzle_orm2.eq)(payments.transactionId, paymentIntent.id));
            for (const payment of paymentsToUpdate) {
              if (!payment.userId) {
                console.error("Payment has no userId:", payment.id);
                continue;
              }
              await db.update(payments).set({
                status: "completed",
                updatedAt: now
              }).where((0, import_drizzle_orm2.eq)(payments.id, payment.id));
              if (payment.subscriptionId) {
                await db.update(userSubscriptions).set({
                  status: "active"
                }).where((0, import_drizzle_orm2.eq)(userSubscriptions.id, payment.subscriptionId));
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
      const userPayments = await db.select().from(payments).where((0, import_drizzle_orm2.eq)(payments.userId, userId)).orderBy(payments.createdAt).limit(limitNum).offset(offsetNum);
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
      const payment = await db.select().from(payments).where((0, import_drizzle_orm2.and)((0, import_drizzle_orm2.eq)(payments.id, id), (0, import_drizzle_orm2.eq)(payments.userId, userId))).limit(1);
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
      const payment = await db.select().from(payments).where((0, import_drizzle_orm2.eq)(payments.id, id)).limit(1);
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
      }).where((0, import_drizzle_orm2.eq)(payments.id, id));
      if (payment[0].subscriptionId) {
        await db.update(userSubscriptions).set({
          status: "cancelled"
        }).where((0, import_drizzle_orm2.eq)(userSubscriptions.id, payment[0].subscriptionId));
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
      const userNotifications = await db.select().from(notifications).where((0, import_drizzle_orm2.eq)(notifications.userId, userId)).orderBy(notifications.createdAt).limit(limitNum).offset(offsetNum);
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
      const notification = await db.select().from(notifications).where((0, import_drizzle_orm2.and)((0, import_drizzle_orm2.eq)(notifications.id, id), (0, import_drizzle_orm2.eq)(notifications.userId, userId))).limit(1);
      if (notification.length === 0) {
        return res.status(404).json({ error: "Notification not found" });
      }
      await db.update(notifications).set({ isRead: 1 }).where((0, import_drizzle_orm2.eq)(notifications.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error("Mark notification read error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/payment-methods", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.userId;
      const methods = await db.select().from(paymentMethods).where((0, import_drizzle_orm2.eq)(paymentMethods.userId, userId)).orderBy(paymentMethods.createdAt);
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
        const user = await db.select().from(users).where((0, import_drizzle_orm2.eq)(users.id, userId)).limit(1);
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
        id: (0, import_crypto.randomUUID)(),
        userId,
        type: type || "card",
        provider: provider || "stripe",
        last4,
        expiryMonth,
        expiryYear,
        isDefault: 0
        // Will be set to default if it's the first method
      }).returning();
      const existingMethods = await db.select().from(paymentMethods).where((0, import_drizzle_orm2.eq)(paymentMethods.userId, userId));
      if (existingMethods.length === 1) {
        await db.update(paymentMethods).set({ isDefault: 1 }).where((0, import_drizzle_orm2.eq)(paymentMethods.id, newMethod[0].id));
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
      const method = await db.select().from(paymentMethods).where((0, import_drizzle_orm2.and)((0, import_drizzle_orm2.eq)(paymentMethods.id, id), (0, import_drizzle_orm2.eq)(paymentMethods.userId, userId))).limit(1);
      if (method.length === 0) {
        return res.status(404).json({ error: "Payment method not found" });
      }
      const updateData = {};
      if (last4 !== void 0) updateData.last4 = last4;
      if (expiryMonth !== void 0) updateData.expiryMonth = expiryMonth;
      if (expiryYear !== void 0) updateData.expiryYear = expiryYear;
      const updatedMethod = await db.update(paymentMethods).set(updateData).where((0, import_drizzle_orm2.eq)(paymentMethods.id, id)).returning();
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
      const method = await db.select().from(paymentMethods).where((0, import_drizzle_orm2.and)((0, import_drizzle_orm2.eq)(paymentMethods.id, id), (0, import_drizzle_orm2.eq)(paymentMethods.userId, userId))).limit(1);
      if (method.length === 0) {
        return res.status(404).json({ error: "Payment method not found" });
      }
      await db.delete(paymentMethods).where((0, import_drizzle_orm2.eq)(paymentMethods.id, id));
      if (method[0].isDefault) {
        const remainingMethods = await db.select().from(paymentMethods).where((0, import_drizzle_orm2.eq)(paymentMethods.userId, userId)).orderBy(paymentMethods.createdAt).limit(1);
        if (remainingMethods.length > 0) {
          await db.update(paymentMethods).set({ isDefault: 1 }).where((0, import_drizzle_orm2.eq)(paymentMethods.id, remainingMethods[0].id));
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
      const method = await db.select().from(paymentMethods).where((0, import_drizzle_orm2.and)((0, import_drizzle_orm2.eq)(paymentMethods.id, id), (0, import_drizzle_orm2.eq)(paymentMethods.userId, userId))).limit(1);
      if (method.length === 0) {
        return res.status(404).json({ error: "Payment method not found" });
      }
      await db.update(paymentMethods).set({ isDefault: 0 }).where((0, import_drizzle_orm2.eq)(paymentMethods.userId, userId));
      await db.update(paymentMethods).set({ isDefault: 1 }).where((0, import_drizzle_orm2.eq)(paymentMethods.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error("Set default payment method error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/subscription-plans", async (req, res) => {
    try {
      const plans = await db.select().from(subscriptionPlans).where((0, import_drizzle_orm2.eq)(subscriptionPlans.isActive, 1));
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
      }).from(userSubscriptions).leftJoin(subscriptionPlans, (0, import_drizzle_orm2.eq)(userSubscriptions.planId, subscriptionPlans.id)).where((0, import_drizzle_orm2.and)(
        (0, import_drizzle_orm2.eq)(userSubscriptions.userId, userId),
        (0, import_drizzle_orm2.eq)(userSubscriptions.status, "active")
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
      const plan = await db.select().from(subscriptionPlans).where((0, import_drizzle_orm2.and)((0, import_drizzle_orm2.eq)(subscriptionPlans.id, planId), (0, import_drizzle_orm2.eq)(subscriptionPlans.isActive, 1))).limit(1);
      if (plan.length === 0) {
        return res.status(404).json({ error: "Subscription plan not found" });
      }
      const existingSub = await db.select().from(userSubscriptions).where((0, import_drizzle_orm2.and)(
        (0, import_drizzle_orm2.eq)(userSubscriptions.userId, userId),
        (0, import_drizzle_orm2.eq)(userSubscriptions.status, "active")
      )).limit(1);
      if (existingSub.length > 0) {
        return res.status(400).json({ error: "User already has an active subscription" });
      }
      const now = Math.floor(Date.now() / 1e3);
      const endDate = now + plan[0].duration * 24 * 60 * 60;
      const newSubscription = await db.insert(userSubscriptions).values({
        id: (0, import_crypto.randomUUID)(),
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
      const subscription = await db.select().from(userSubscriptions).where((0, import_drizzle_orm2.eq)(userSubscriptions.id, id)).limit(1);
      if (subscription.length === 0 || subscription[0].userId !== userId) {
        return res.status(404).json({ error: "Subscription not found" });
      }
      const updateData = { updatedAt: Math.floor(Date.now() / 1e3) };
      if (status !== void 0) updateData.status = status;
      if (autoRenew !== void 0) updateData.autoRenew = autoRenew ? 1 : 0;
      const updatedSubscription = await db.update(userSubscriptions).set(updateData).where((0, import_drizzle_orm2.eq)(userSubscriptions.id, id)).returning();
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
      const subscription = await db.select().from(userSubscriptions).where((0, import_drizzle_orm2.eq)(userSubscriptions.id, id)).limit(1);
      if (subscription.length === 0 || subscription[0].userId !== userId) {
        return res.status(404).json({ error: "Subscription not found" });
      }
      if (cancelAtPeriodEnd) {
        await db.update(userSubscriptions).set({
          autoRenew: 0,
          updatedAt: Math.floor(Date.now() / 1e3)
        }).where((0, import_drizzle_orm2.eq)(userSubscriptions.id, id));
      } else {
        await db.update(userSubscriptions).set({
          status: "cancelled",
          autoRenew: 0,
          updatedAt: Math.floor(Date.now() / 1e3)
        }).where((0, import_drizzle_orm2.eq)(userSubscriptions.id, id));
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
      const subscription = await db.select().from(userSubscriptions).where((0, import_drizzle_orm2.and)((0, import_drizzle_orm2.eq)(userSubscriptions.id, id), (0, import_drizzle_orm2.eq)(userSubscriptions.userId, userId))).limit(1);
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
      const plan = await db.select().from(subscriptionPlans).where((0, import_drizzle_orm2.eq)(subscriptionPlans.id, sub.planId)).limit(1);
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
      }).where((0, import_drizzle_orm2.eq)(userSubscriptions.id, id));
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
      const subscription = await db.select().from(userSubscriptions).where((0, import_drizzle_orm2.and)((0, import_drizzle_orm2.eq)(userSubscriptions.id, id), (0, import_drizzle_orm2.eq)(userSubscriptions.userId, userId))).limit(1);
      if (subscription.length === 0) {
        return res.status(404).json({ error: "Subscription not found" });
      }
      const newPlan = await db.select().from(subscriptionPlans).where((0, import_drizzle_orm2.and)(
        (0, import_drizzle_orm2.eq)(subscriptionPlans.id, newPlanId),
        (0, import_drizzle_orm2.eq)(subscriptionPlans.isActive, 1)
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
      }).where((0, import_drizzle_orm2.eq)(userSubscriptions.id, id));
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
      }).from(userSubscriptions).leftJoin(subscriptionPlans, (0, import_drizzle_orm2.eq)(userSubscriptions.planId, subscriptionPlans.id)).where((0, import_drizzle_orm2.eq)(userSubscriptions.userId, userId)).orderBy(userSubscriptions.createdAt).limit(limitNum).offset(offsetNum);
      res.json(subscriptions);
    } catch (error) {
      console.error("Get subscription history error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  return { server: httpServer || (0, import_node_http.createServer)(app2), processPaymentRetries };
}

// server/index.ts
var import_node_http2 = require("node:http");
var import_socket = require("socket.io");
var fs2 = __toESM(require("fs"));
var path2 = __toESM(require("path"));
var import_drizzle_orm3 = require("drizzle-orm");
var app = (0, import_express.default)();
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
    import_express.default.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      }
    })
  );
  app2.use(import_express.default.urlencoded({ extended: false }));
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
  app2.use("/assets", import_express.default.static(path2.resolve(process.cwd(), "assets")));
  app2.use(import_express.default.static(path2.resolve(process.cwd(), "dist")));
  log("Expo routing: Checking expo-platform header on / and /manifest");
}
function setupSocketIO(httpServer) {
  const io = new import_socket.Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  io.on("connection", (socket) => {
    log(`Socket connected: ${socket.id}`);
    socket.on("join-live-class", async (data) => {
      try {
        const session = await db.select().from(liveSessions).where((0, import_drizzle_orm3.eq)(liveSessions.id, data.sessionId)).limit(1);
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
  const httpServer = (0, import_node_http2.createServer)(app);
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
