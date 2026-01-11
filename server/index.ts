import express from "express";
import type { Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { createServer } from "node:http";
import { Server as SocketServer } from "socket.io";
import * as fs from "fs";
import * as path from "path";
import { db } from "./storage";
import { eq, sql } from "drizzle-orm";
import { liveSessions } from "../shared/schema";

const app = express();
app.set('etag', false); // Disable ETag to prevent 304 responses
const log = console.log;

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

function setupCors(app: express.Application) {
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS",
    );
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Credentials", "true");
    // Allow iframe embedding for development
    res.removeHeader("X-Frame-Options");

    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }

    next();
  });
}

function setupBodyParsing(app: express.Application) {
  app.use(
    express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  app.use(express.urlencoded({ extended: false }));
}

function setupRequestLogging(app: express.Application) {
  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, unknown> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      if (!path.startsWith("/api")) return;

      const duration = Date.now() - start;

      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    });

    next();
  });
}


function configureStaticServing(app: express.Application) {
  app.use("/assets", express.static(path.resolve(process.cwd(), "assets")));
  app.use(express.static(path.resolve(process.cwd(), "dist")));

  log("Serving static files from dist directory");
}

function setupSocketIO(httpServer: any) {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    log(`Socket connected: ${socket.id}`);

    socket.on("join-live-class", async (data) => {
      try {
        // Check if session is still live
        const session = await db.select().from(liveSessions).where(eq(liveSessions.id, data.sessionId)).limit(1);
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
      // Broadcast to all clients to refetch sessions
      io.emit("session-started", data);
    });

    // WebRTC signaling
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
    log("Running database migrations and initialization...");

    // Import the database client directly to run raw SQL
    const Database = require('better-sqlite3');
    const dbClient = new Database("./database.db");

    // Create all tables first using raw SQL
    const tables = [
      `CREATE TABLE IF NOT EXISTS users (
        id text PRIMARY KEY,
        username text,
        email text UNIQUE,
        password text,
        name text,
        role text DEFAULT 'student',
        "selectedCourses" text DEFAULT '[]',
        "createdAt" integer DEFAULT (strftime('%s', 'now')),
        "updatedAt" integer DEFAULT (strftime('%s', 'now'))
      )`,

      `CREATE TABLE IF NOT EXISTS courses (
        id text PRIMARY KEY,
        name text NOT NULL,
        code text NOT NULL,
        category text,
        description text,
        "lecturerId" text,
        "lecturerName" text,
        "createdAt" integer DEFAULT (strftime('%s', 'now'))
      )`,

      `CREATE TABLE IF NOT EXISTS live_sessions (
        id text PRIMARY KEY,
        "courseId" text,
        "lecturerId" text,
        topic text,
        "scheduledTime" integer,
        "startTime" integer,
        "endTime" integer,
        "isLive" integer DEFAULT 0,
        "lecturerName" text,
        participants integer DEFAULT 0,
        settings text,
        "currentDocument" text,
        "currentPage" integer DEFAULT 1,
        annotations text,
        "currentTool" text DEFAULT 'draw',
        "currentPath" text,
        "scrollPosition" integer DEFAULT 0,
        messages text,
        attendees text,
        "micStates" text,
        "createdAt" integer DEFAULT (strftime('%s', 'now'))
      )`,

      `CREATE TABLE IF NOT EXISTS lecturer_materials (
        id text PRIMARY KEY,
        "lecturerId" text,
        "courseId" text,
        title text NOT NULL,
        description text,
        "fileUrl" text,
        "fileType" text,
        content text,
        size integer,
        "isDeleted" integer DEFAULT 0,
        "createdAt" integer DEFAULT (strftime('%s', 'now'))
      )`,

      `CREATE TABLE IF NOT EXISTS chat_messages (
        id text PRIMARY KEY,
        "sessionId" text,
        "userId" text,
        message text,
        timestamp integer,
        status text DEFAULT 'sent'
      )`,

      `CREATE TABLE IF NOT EXISTS shared_documents (
        id text PRIMARY KEY,
        "sessionId" text,
        "userId" text,
        title text,
        "fileUrl" text,
        "fileType" text,
        "createdAt" integer DEFAULT (strftime('%s', 'now'))
      )`,

      `CREATE TABLE IF NOT EXISTS tutor_requests (
        id text PRIMARY KEY,
        "studentId" text,
        "courseId" text,
        type text,
        title text,
        description text,
        response text,
        status text DEFAULT 'pending',
        messages text,
        "createdAt" integer DEFAULT (strftime('%s', 'now')),
        "updatedAt" integer DEFAULT (strftime('%s', 'now'))
      )`,

      `CREATE TABLE IF NOT EXISTS user_tutors (
        id text PRIMARY KEY,
        "studentId" text,
        "tutorId" text,
        "courseId" text,
        status text DEFAULT 'active',
        "assignedBy" text,
        "assignedAt" integer DEFAULT (strftime('%s', 'now'))
      )`,

      `CREATE TABLE IF NOT EXISTS support_requests (
        id text PRIMARY KEY,
        "userId" text,
        type text,
        title text,
        description text,
        status text DEFAULT 'open',
        "assignedTo" text,
        "createdAt" integer DEFAULT (strftime('%s', 'now')),
        "updatedAt" integer DEFAULT (strftime('%s', 'now'))
      )`,

      `CREATE TABLE IF NOT EXISTS notifications (
        id text PRIMARY KEY,
        "userId" text,
        type text,
        title text,
        message text,
        "isRead" integer DEFAULT 0,
        data text,
        "createdAt" integer DEFAULT (strftime('%s', 'now'))
      )`,

      `CREATE TABLE IF NOT EXISTS user_analytics (
        id text PRIMARY KEY,
        "userId" text,
        metric text,
        value real,
        date integer,
        "createdAt" integer DEFAULT (strftime('%s', 'now'))
      )`,

      `CREATE TABLE IF NOT EXISTS subscription_plans (
        id text PRIMARY KEY,
        name text NOT NULL,
        description text,
        price integer,
        currency text DEFAULT 'USD',
        duration integer,
        features text,
        "isActive" integer DEFAULT 1,
        "createdAt" integer DEFAULT (strftime('%s', 'now'))
      )`,

      `CREATE TABLE IF NOT EXISTS user_subscriptions (
        id text PRIMARY KEY,
        "userId" text,
        "planId" text,
        status text DEFAULT 'active',
        "startDate" integer,
        "endDate" integer,
        "autoRenew" integer DEFAULT 1,
        "createdAt" integer DEFAULT (strftime('%s', 'now')),
        "updatedAt" integer DEFAULT (strftime('%s', 'now'))
      )`,

      `CREATE TABLE IF NOT EXISTS payments (
        id text PRIMARY KEY,
        "userId" text,
        "subscriptionId" text,
        amount real,
        currency text DEFAULT 'USD',
        status text DEFAULT 'pending',
        "paymentMethod" text,
        "transactionId" text,
        description text,
        "retryCount" integer DEFAULT 0,
        "nextRetryAt" integer,
        "maxRetries" integer DEFAULT 5,
        "mobileProvider" text,
        "mobileNumber" text,
        "otpRequired" integer DEFAULT 0,
        "otpVerified" integer DEFAULT 0,
        "otpId" text,
        "otpExpiresAt" integer,
        "createdAt" integer DEFAULT (strftime('%s', 'now')),
        "updatedAt" integer DEFAULT (strftime('%s', 'now'))
      )`,

      `CREATE TABLE IF NOT EXISTS payment_methods (
        id text PRIMARY KEY,
        "userId" text,
        type text,
        provider text,
        "last4" text,
        "expiryMonth" integer,
        "expiryYear" integer,
        "isDefault" integer DEFAULT 0,
        "createdAt" integer DEFAULT (strftime('%s', 'now'))
      )`,

      `CREATE TABLE IF NOT EXISTS deleted_materials (
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
      )`
    ];

    // Execute each table creation
    for (const tableSQL of tables) {
      dbClient.exec(tableSQL);
    }

    // Create indexes
    dbClient.exec(`
      CREATE INDEX IF NOT EXISTS idx_lecturer_materials_lecturer_id_is_deleted
      ON lecturer_materials ("lecturerId", "isDeleted")
    `);

    dbClient.close();
    log("Database initialization completed successfully");
  } catch (error) {
    log("Database initialization error:", error);
  }
}

function setupErrorHandler(app: express.Application) {
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const error = err as {
      status?: number;
      statusCode?: number;
      message?: string;
    };

    const status = error.status || error.statusCode || 500;
    const message = error.message || "Internal Server Error";
res.status(status).json({ message });

console.error(err);

  });
}

(async () => {
  setupCors(app);
  setupBodyParsing(app);
  setupRequestLogging(app);

  configureStaticServing(app);

  // Run migrations
  await runMigrations();

  const httpServer = createServer(app);
  const io = setupSocketIO(httpServer);

  const { server, processPaymentRetries } = await registerRoutes(app, httpServer, io);

  setupErrorHandler(app);

  const port = parseInt(process.env.PORT || "5001", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
    },
    () => {
      log(`express server with socket.io serving on port ${port}`);

      // Start payment retry processor
      setInterval(() => {
        processPaymentRetries().catch((error: any) => {
          console.error('Error in payment retry processor:', error);
        });
      }, 60 * 1000); // Check every minute
      log('Payment retry processor started');
    },
  );
})();
