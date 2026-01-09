ALTER TABLE "payments" ADD COLUMN "retryCount" integer DEFAULT 0;
ALTER TABLE "payments" ADD COLUMN "nextRetryAt" integer;
ALTER TABLE "payments" ADD COLUMN "maxRetries" integer DEFAULT 5;
ALTER TABLE "payments" ADD COLUMN "updatedAt" integer DEFAULT (unixepoch());
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"data" text,
	"isRead" integer DEFAULT 0,
	"createdAt" integer DEFAULT (unixepoch())
);
--> statement-breakpoint