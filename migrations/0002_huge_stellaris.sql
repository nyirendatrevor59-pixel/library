CREATE TABLE "chat_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"sessionId" text,
	"userId" text,
	"message" text NOT NULL,
	"timestamp" integer DEFAULT extract(epoch from now())
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"category" text NOT NULL,
	"description" text,
	"lecturerId" text,
	"lecturerName" text,
	"createdAt" integer DEFAULT extract(epoch from now()),
	CONSTRAINT "courses_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "deleted_materials" (
	"id" text PRIMARY KEY NOT NULL,
	"originalId" text NOT NULL,
	"lecturerId" text,
	"courseId" text,
	"title" text NOT NULL,
	"description" text,
	"fileUrl" text,
	"fileType" text,
	"content" text,
	"size" integer,
	"createdAt" integer DEFAULT extract(epoch from now()),
	"deletedAt" integer DEFAULT extract(epoch from now())
);
--> statement-breakpoint
CREATE TABLE "lecturer_materials" (
	"id" text PRIMARY KEY NOT NULL,
	"lecturerId" text,
	"courseId" text,
	"title" text NOT NULL,
	"description" text,
	"fileUrl" text,
	"fileType" text,
	"content" text,
	"size" integer,
	"createdAt" integer DEFAULT extract(epoch from now()),
	"isDeleted" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "live_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"courseId" text,
	"lecturerId" text,
	"lecturerName" text,
	"topic" text NOT NULL,
	"scheduledTime" integer,
	"startTime" integer,
	"endTime" integer,
	"isLive" integer DEFAULT 0,
	"participants" integer DEFAULT 0,
	"settings" text,
	"currentDocument" text,
	"currentPage" integer DEFAULT 1,
	"annotations" text,
	"currentTool" text DEFAULT 'draw',
	"createdAt" integer DEFAULT extract(epoch from now())
);
--> statement-breakpoint
CREATE TABLE "shared_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"sessionId" text,
	"userId" text,
	"title" text NOT NULL,
	"fileUrl" text NOT NULL,
	"fileType" text NOT NULL,
	"annotations" text,
	"sharedAt" integer DEFAULT extract(epoch from now())
);
--> statement-breakpoint
CREATE TABLE "support_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'open',
	"assignedTo" text,
	"createdAt" integer DEFAULT extract(epoch from now()),
	"updatedAt" integer DEFAULT extract(epoch from now())
);
--> statement-breakpoint
CREATE TABLE "tutor_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"studentId" text,
	"courseId" text,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'pending',
	"createdAt" integer DEFAULT extract(epoch from now()),
	"updatedAt" integer DEFAULT extract(epoch from now())
);
--> statement-breakpoint
CREATE TABLE "user_analytics" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text,
	"metric" text NOT NULL,
	"value" integer NOT NULL,
	"date" integer DEFAULT extract(epoch from now())
);
--> statement-breakpoint
CREATE TABLE "user_tutors" (
	"id" text PRIMARY KEY NOT NULL,
	"studentId" text,
	"tutorId" text,
	"courseId" text,
	"assignedBy" text,
	"assignedAt" integer DEFAULT extract(epoch from now()),
	"status" text DEFAULT 'active'
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"role" text DEFAULT 'student' NOT NULL,
	"name" text NOT NULL,
	"selectedCourses" text DEFAULT '[]',
	"createdAt" integer DEFAULT extract(epoch from now()),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sessionId_live_sessions_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."live_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_lecturerId_users_id_fk" FOREIGN KEY ("lecturerId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deleted_materials" ADD CONSTRAINT "deleted_materials_lecturerId_users_id_fk" FOREIGN KEY ("lecturerId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deleted_materials" ADD CONSTRAINT "deleted_materials_courseId_courses_id_fk" FOREIGN KEY ("courseId") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lecturer_materials" ADD CONSTRAINT "lecturer_materials_lecturerId_users_id_fk" FOREIGN KEY ("lecturerId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lecturer_materials" ADD CONSTRAINT "lecturer_materials_courseId_courses_id_fk" FOREIGN KEY ("courseId") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_courseId_courses_id_fk" FOREIGN KEY ("courseId") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_lecturerId_users_id_fk" FOREIGN KEY ("lecturerId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_documents" ADD CONSTRAINT "shared_documents_sessionId_live_sessions_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."live_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_documents" ADD CONSTRAINT "shared_documents_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_requests" ADD CONSTRAINT "support_requests_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_requests" ADD CONSTRAINT "support_requests_assignedTo_users_id_fk" FOREIGN KEY ("assignedTo") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutor_requests" ADD CONSTRAINT "tutor_requests_studentId_users_id_fk" FOREIGN KEY ("studentId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutor_requests" ADD CONSTRAINT "tutor_requests_courseId_courses_id_fk" FOREIGN KEY ("courseId") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_analytics" ADD CONSTRAINT "user_analytics_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_tutors" ADD CONSTRAINT "user_tutors_studentId_users_id_fk" FOREIGN KEY ("studentId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_tutors" ADD CONSTRAINT "user_tutors_tutorId_users_id_fk" FOREIGN KEY ("tutorId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_tutors" ADD CONSTRAINT "user_tutors_courseId_courses_id_fk" FOREIGN KEY ("courseId") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_tutors" ADD CONSTRAINT "user_tutors_assignedBy_users_id_fk" FOREIGN KEY ("assignedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;