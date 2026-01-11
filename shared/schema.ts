import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("student"), // student, lecturer, tutor, admin
  name: text("name").notNull(),
  selectedCourses: text("selectedCourses").default("[]"), // JSON string
  createdAt: integer("createdAt"),
});

export const courses = sqliteTable("courses", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  category: text("category").notNull(),
  description: text("description"),
  lecturerId: text("lecturerId").references(() => users.id),
  lecturerName: text("lecturerName"),
  createdAt: integer("createdAt"),
});

export const liveSessions = sqliteTable("live_sessions", {
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
  settings: text("settings"), // JSON string
  currentDocument: text("currentDocument"), // JSON string: { id, title, url }
  currentPage: integer("currentPage").default(1),
  annotations: text("annotations"), // JSON string
  currentTool: text("currentTool").default("draw"),
  createdAt: integer("createdAt"),
});

export const chatMessages = sqliteTable("chat_messages", {
  id: text("id").primaryKey(),
  sessionId: text("sessionId").references(() => liveSessions.id),
  userId: text("userId").references(() => users.id),
  message: text("message").notNull(),
  timestamp: integer("timestamp"),
});

export const sharedDocuments = sqliteTable("shared_documents", {
  id: text("id").primaryKey(),
  sessionId: text("sessionId").references(() => liveSessions.id),
  userId: text("userId").references(() => users.id),
  title: text("title").notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileType: text("fileType").notNull(), // pdf, doc, docx
  annotations: text("annotations"), // JSON string
  sharedAt: integer("sharedAt"),
});

export const lecturerMaterials = sqliteTable("lecturer_materials", {
  id: text("id").primaryKey(),
  lecturerId: text("lecturerId").references(() => users.id),
  courseId: text("courseId").references(() => courses.id),
  title: text("title").notNull(),
  description: text("description"),
  fileUrl: text("fileUrl"),
  fileType: text("fileType"), // pdf, doc, docx, link
  content: text("content"), // For text content or link
  size: integer("size"), // File size in bytes
  createdAt: integer("createdAt"),
  isDeleted: integer("isDeleted").default(0),
});

export const tutorRequests = sqliteTable("tutor_requests", {
  id: text("id").primaryKey(),
  studentId: text("studentId").references(() => users.id),
  courseId: text("courseId").references(() => courses.id),
  type: text("type").notNull(), // topic_help, question, assignment_help
  title: text("title").notNull(),
  description: text("description"),
  messages: text("messages"), // JSON string for conversation history
  response: text("response"), // Tutor's response to the request
  status: text("status").default("pending"), // pending, answered, resolved
  createdAt: integer("createdAt"),
  updatedAt: integer("updatedAt"),
});

export const deletedMaterials = sqliteTable("deleted_materials", {
  id: text("id").primaryKey(),
  originalId: text("originalId").notNull(),
  lecturerId: text("lecturerId").references(() => users.id),
  courseId: text("courseId").references(() => courses.id),
  title: text("title").notNull(),
  description: text("description"),
  fileUrl: text("fileUrl"),
  fileType: text("fileType"), // pdf, doc, docx, link
  content: text("content"), // For text content or link
  size: integer("size"), // File size in bytes
  createdAt: integer("createdAt"),
  deletedAt: integer("deletedAt"),
});

export const supportRequests = sqliteTable("support_requests", {
  id: text("id").primaryKey(),
  userId: text("userId").references(() => users.id),
  type: text("type").notNull(), // password_reset, account_issue, technical_problem, other
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("open"), // open, in_progress, resolved, closed
  assignedTo: text("assignedTo").references(() => users.id), // admin/tutor handling it
  createdAt: integer("createdAt"),
  updatedAt: integer("updatedAt"),
});

export const userAnalytics = sqliteTable("user_analytics", {
  id: text("id").primaryKey(),
  userId: text("userId").references(() => users.id),
  metric: text("metric").notNull(), // sessions_attended, documents_viewed, messages_sent, etc.
  value: integer("value").notNull(),
  date: integer("date"), // unix timestamp
});

export const userTutors = sqliteTable("user_tutors", {
  id: text("id").primaryKey(),
  studentId: text("studentId").references(() => users.id),
  tutorId: text("tutorId").references(() => users.id),
  courseId: text("courseId").references(() => courses.id),
  assignedBy: text("assignedBy").references(() => users.id), // who assigned
  assignedAt: integer("assignedAt"),
  status: text("status").default("active"), // active, inactive
});

export const subscriptionPlans = sqliteTable("subscription_plans", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(), // Price in cents
  currency: text("currency").notNull().default("USD"),
  duration: integer("duration").notNull(), // Duration in days
  features: text("features"), // JSON string
  isActive: integer("isActive").default(1),
  createdAt: integer("createdAt"),
});

export const userSubscriptions = sqliteTable("user_subscriptions", {
  id: text("id").primaryKey(),
  userId: text("userId").references(() => users.id),
  planId: text("planId").references(() => subscriptionPlans.id),
  status: text("status").notNull().default("active"), // active, cancelled, expired, paused
  startDate: integer("startDate").notNull(),
  endDate: integer("endDate").notNull(),
  autoRenew: integer("autoRenew").default(1), // boolean
  createdAt: integer("createdAt"),
  updatedAt: integer("updatedAt"),
});

export const payments = sqliteTable("payments", {
  id: text("id").primaryKey(),
  userId: text("userId").references(() => users.id),
  subscriptionId: text("subscriptionId").references(() => userSubscriptions.id), // nullable
  amount: integer("amount").notNull(), // Amount in cents
  currency: text("currency").notNull().default("USD"),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed, refunded, retrying, otp_required
  paymentMethod: text("paymentMethod").notNull(), // card, mpesa, airtel, paypal, etc.
  transactionId: text("transactionId"), // External payment provider ID
  description: text("description"),
  retryCount: integer("retryCount").default(0),
  nextRetryAt: integer("nextRetryAt"),
  maxRetries: integer("maxRetries").default(5),
  // Mobile payment specific fields
  mobileProvider: text("mobileProvider"), // mpesa, airtel, etc.
  mobileNumber: text("mobileNumber"), // Phone number for mobile payments
  otpRequired: integer("otpRequired").default(0), // Boolean flag for OTP requirement
  otpVerified: integer("otpVerified").default(0), // Boolean flag for OTP verification status
  otpId: text("otpId"), // OTP verification ID from provider
  otpExpiresAt: integer("otpExpiresAt"), // OTP expiration timestamp
  createdAt: integer("createdAt"),
  updatedAt: integer("updatedAt"),
});

export const paymentMethods = sqliteTable("payment_methods", {
  id: text("id").primaryKey(),
  userId: text("userId").references(() => users.id),
  type: text("type").notNull(), // card, paypal, bank_transfer
  provider: text("provider").notNull(), // stripe, paypal, etc.
  last4: text("last4"), // Last 4 digits for cards
  expiryMonth: integer("expiryMonth"),
  expiryYear: integer("expiryYear"),
  isDefault: integer("isDefault").default(0), // boolean
  createdAt: integer("createdAt"),
});

export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("userId").references(() => users.id),
  type: text("type").notNull(), // payment_failed, payment_retry, payment_success, otp_sent
  title: text("title").notNull(),
  message: text("message").notNull(),
  data: text("data"), // JSON string for additional data
  isRead: integer("isRead").default(0),
  createdAt: integer("createdAt"),
});

// Mobile payment OTP verification
export const otpVerifications = sqliteTable("otp_verifications", {
  id: text("id").primaryKey(),
  paymentId: text("paymentId").references(() => payments.id),
  otpCode: text("otpCode").notNull(), // Hashed OTP code
  phoneNumber: text("phoneNumber").notNull(),
  provider: text("provider").notNull(), // mpesa, airtel, etc.
  status: text("status").notNull().default("pending"), // pending, verified, expired, failed
  attempts: integer("attempts").default(0),
  maxAttempts: integer("maxAttempts").default(3),
  expiresAt: integer("expiresAt").notNull(),
  verifiedAt: integer("verifiedAt"),
  createdAt: integer("createdAt"),
});

// Mobile payment provider configurations
export const mobilePaymentProviders = sqliteTable("mobile_payment_providers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(), // mpesa, airtel, zamtel, etc.
  displayName: text("displayName").notNull(),
  country: text("country").notNull(), // ZM, KE, TZ, etc.
  currency: text("currency").notNull(), // ZMW, KES, TZS, etc.
  minAmount: integer("minAmount").notNull(), // Minimum amount in cents
  maxAmount: integer("maxAmount").notNull(), // Maximum amount in cents
  isActive: integer("isActive").default(1),
  apiEndpoint: text("apiEndpoint"), // For production API
  apiKey: text("apiKey"), // Encrypted API key
  apiSecret: text("apiSecret"), // Encrypted API secret
  webhookUrl: text("webhookUrl"),
  createdAt: integer("createdAt"),
  updatedAt: integer("updatedAt"),
});

// Insert schemas
export const insertUserSchema = z.object({
  username: z.string(),
  email: z.string(),
  password: z.string(),
  role: z.string().optional().default("student"),
  name: z.string(),
});

export const insertCourseSchema = z.object({
  name: z.string(),
  code: z.string(),
  category: z.string(),
  description: z.string().optional(),
  lecturerId: z.string().optional(),
});

export const insertLiveSessionSchema = z.object({
  courseId: z.string(),
  lecturerId: z.string(),
  topic: z.string(),
  scheduledTime: z.number().optional(),
});

export const insertChatMessageSchema = z.object({
  sessionId: z.string(),
  userId: z.string(),
  message: z.string(),
});

export const insertSharedDocumentSchema = z.object({
  sessionId: z.string(),
  userId: z.string(),
  title: z.string(),
  fileUrl: z.string(),
  fileType: z.string(),
});

export const insertLecturerMaterialSchema = z.object({
  lecturerId: z.string(),
  courseId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  fileUrl: z.string().optional(),
  fileType: z.string().optional(),
  content: z.string().optional(),
  size: z.number().optional(),
});

export const insertTutorRequestSchema = z.object({
  studentId: z.string(),
  courseId: z.string(),
  type: z.string(),
  title: z.string(),
  description: z.string().optional(),
  messages: z.string().optional(),
});

export const insertDeletedMaterialSchema = z.object({
  originalId: z.string(),
  lecturerId: z.string(),
  courseId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  fileUrl: z.string().optional(),
  fileType: z.string().optional(),
  content: z.string().optional(),
  size: z.number().optional(),
});

export const insertSupportRequestSchema = z.object({
  userId: z.string(),
  type: z.string(),
  title: z.string(),
  description: z.string().optional(),
});

export const insertUserAnalyticsSchema = z.object({
  userId: z.string(),
  metric: z.string(),
  value: z.number(),
  date: z.number().optional(),
});

export const insertUserTutorSchema = z.object({
  studentId: z.string(),
  tutorId: z.string(),
  courseId: z.string(),
  assignedBy: z.string(),
});

export const insertSubscriptionPlanSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  price: z.number(),
  currency: z.string().optional().default("USD"),
  duration: z.number(),
  features: z.string().optional(),
  isActive: z.number().optional().default(1),
});

export const insertUserSubscriptionSchema = z.object({
  userId: z.string(),
  planId: z.string(),
  status: z.string().optional().default("active"),
  startDate: z.number(),
  endDate: z.number(),
  autoRenew: z.number().optional().default(1),
});

export const insertPaymentSchema = z.object({
  userId: z.string(),
  subscriptionId: z.string().optional(),
  amount: z.number(),
  currency: z.string().optional().default("USD"),
  status: z.string().optional().default("pending"),
  paymentMethod: z.string(),
  transactionId: z.string().optional(),
  description: z.string().optional(),
});

export const insertPaymentMethodSchema = z.object({
  userId: z.string(),
  type: z.string(),
  provider: z.string(),
  last4: z.string().optional(),
  expiryMonth: z.number().optional(),
  expiryYear: z.number().optional(),
  isDefault: z.number().optional().default(0),
});

export const insertOtpVerificationSchema = z.object({
  paymentId: z.string().optional(),
  otpCode: z.string(),
  phoneNumber: z.string(),
  provider: z.string(),
  status: z.string().optional().default("pending"),
  attempts: z.number().optional().default(0),
  maxAttempts: z.number().optional().default(3),
  expiresAt: z.number(),
  verifiedAt: z.number().optional(),
});

export const insertMobilePaymentProviderSchema = z.object({
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
  webhookUrl: z.string().optional(),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = Omit<typeof users.$inferSelect, 'selectedCourses'> & { selectedCourses: string[] };
export type Course = typeof courses.$inferSelect;
export type LiveSession = typeof liveSessions.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type SharedDocument = typeof sharedDocuments.$inferSelect;
export type LecturerMaterial = typeof lecturerMaterials.$inferSelect;
export type DeletedMaterial = typeof deletedMaterials.$inferSelect;
export type TutorRequest = typeof tutorRequests.$inferSelect;
export type SupportRequest = typeof supportRequests.$inferSelect;
export type UserAnalytics = typeof userAnalytics.$inferSelect;
export type UserTutor = typeof userTutors.$inferSelect;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type OtpVerification = typeof otpVerifications.$inferSelect;
export type MobilePaymentProvider = typeof mobilePaymentProviders.$inferSelect;

// Insert types
export type InsertLecturerMaterial = z.infer<typeof insertLecturerMaterialSchema>;
export type InsertLiveSession = z.infer<typeof insertLiveSessionSchema>;
export type InsertDeletedMaterial = z.infer<typeof insertDeletedMaterialSchema>;
export type InsertTutorRequest = z.infer<typeof insertTutorRequestSchema>;
export type InsertSupportRequest = z.infer<typeof insertSupportRequestSchema>;
export type InsertUserAnalytics = z.infer<typeof insertUserAnalyticsSchema>;
export type InsertUserTutor = z.infer<typeof insertUserTutorSchema>;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type InsertUserSubscription = z.infer<typeof insertUserSubscriptionSchema>;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;
export type InsertOtpVerification = z.infer<typeof insertOtpVerificationSchema>;
export type InsertMobilePaymentProvider = z.infer<typeof insertMobilePaymentProviderSchema>;
