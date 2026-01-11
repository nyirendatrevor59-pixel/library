CREATE TABLE "mobile_payment_providers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"displayName" text NOT NULL,
	"country" text NOT NULL,
	"currency" text NOT NULL,
	"minAmount" integer NOT NULL,
	"maxAmount" integer NOT NULL,
	"isActive" integer DEFAULT 1,
	"apiEndpoint" text,
	"apiKey" text,
	"apiSecret" text,
	"webhookUrl" text,
	"createdAt" integer DEFAULT extract(epoch from now())::int,
	"updatedAt" integer DEFAULT extract(epoch from now())::int
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"data" text,
	"isRead" integer DEFAULT 0,
	"createdAt" integer DEFAULT extract(epoch from now())::int
);
--> statement-breakpoint
CREATE TABLE "otp_verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"paymentId" text,
	"otpCode" text NOT NULL,
	"phoneNumber" text NOT NULL,
	"provider" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0,
	"maxAttempts" integer DEFAULT 3,
	"expiresAt" integer NOT NULL,
	"verifiedAt" integer,
	"createdAt" integer DEFAULT extract(epoch from now())::int
);
--> statement-breakpoint
CREATE TABLE "payment_methods" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"last4" text,
	"expiryMonth" integer,
	"expiryYear" integer,
	"isDefault" integer DEFAULT 0,
	"createdAt" integer DEFAULT extract(epoch from now())::int
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text,
	"subscriptionId" text,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"paymentMethod" text NOT NULL,
	"transactionId" text,
	"description" text,
	"retryCount" integer DEFAULT 0,
	"nextRetryAt" integer,
	"maxRetries" integer DEFAULT 5,
	"mobileProvider" text,
	"mobileNumber" text,
	"otpRequired" integer DEFAULT 0,
	"otpVerified" integer DEFAULT 0,
	"otpId" text,
	"otpExpiresAt" integer,
	"createdAt" integer DEFAULT extract(epoch from now())::int,
	"updatedAt" integer DEFAULT extract(epoch from now())::int
);
--> statement-breakpoint
CREATE TABLE "subscription_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"duration" integer NOT NULL,
	"features" text,
	"isActive" integer DEFAULT 1,
	"createdAt" integer DEFAULT extract(epoch from now())::int
);
--> statement-breakpoint
CREATE TABLE "user_subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text,
	"planId" text,
	"status" text DEFAULT 'active' NOT NULL,
	"startDate" integer NOT NULL,
	"endDate" integer NOT NULL,
	"autoRenew" integer DEFAULT 1,
	"createdAt" integer DEFAULT extract(epoch from now())::int,
	"updatedAt" integer DEFAULT extract(epoch from now())::int
);
--> statement-breakpoint
ALTER TABLE "chat_messages" ALTER COLUMN "timestamp" SET DEFAULT extract(epoch from now())::int;--> statement-breakpoint
ALTER TABLE "courses" ALTER COLUMN "createdAt" SET DEFAULT extract(epoch from now())::int;--> statement-breakpoint
ALTER TABLE "deleted_materials" ALTER COLUMN "createdAt" SET DEFAULT extract(epoch from now())::int;--> statement-breakpoint
ALTER TABLE "deleted_materials" ALTER COLUMN "deletedAt" SET DEFAULT extract(epoch from now())::int;--> statement-breakpoint
ALTER TABLE "lecturer_materials" ALTER COLUMN "createdAt" SET DEFAULT extract(epoch from now())::int;--> statement-breakpoint
ALTER TABLE "live_sessions" ALTER COLUMN "createdAt" SET DEFAULT extract(epoch from now())::int;--> statement-breakpoint
ALTER TABLE "shared_documents" ALTER COLUMN "sharedAt" SET DEFAULT extract(epoch from now())::int;--> statement-breakpoint
ALTER TABLE "support_requests" ALTER COLUMN "createdAt" SET DEFAULT extract(epoch from now())::int;--> statement-breakpoint
ALTER TABLE "support_requests" ALTER COLUMN "updatedAt" SET DEFAULT extract(epoch from now())::int;--> statement-breakpoint
ALTER TABLE "tutor_requests" ALTER COLUMN "createdAt" SET DEFAULT extract(epoch from now())::int;--> statement-breakpoint
ALTER TABLE "tutor_requests" ALTER COLUMN "updatedAt" SET DEFAULT extract(epoch from now())::int;--> statement-breakpoint
ALTER TABLE "user_analytics" ALTER COLUMN "date" SET DEFAULT extract(epoch from now())::int;--> statement-breakpoint
ALTER TABLE "user_tutors" ALTER COLUMN "assignedAt" SET DEFAULT extract(epoch from now())::int;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "createdAt" SET DEFAULT extract(epoch from now())::int;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "otp_verifications" ADD CONSTRAINT "otp_verifications_paymentId_payments_id_fk" FOREIGN KEY ("paymentId") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscriptionId_user_subscriptions_id_fk" FOREIGN KEY ("subscriptionId") REFERENCES "public"."user_subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_planId_subscription_plans_id_fk" FOREIGN KEY ("planId") REFERENCES "public"."subscription_plans"("id") ON DELETE no action ON UPDATE no action;