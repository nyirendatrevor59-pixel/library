ALTER TABLE "live_sessions" ADD COLUMN "currentDocument" text;
ALTER TABLE "live_sessions" ADD COLUMN "currentPage" integer DEFAULT 1;
ALTER TABLE "live_sessions" ADD COLUMN "annotations" text;
ALTER TABLE "live_sessions" ADD COLUMN "currentTool" text DEFAULT 'draw';