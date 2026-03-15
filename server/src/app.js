import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import passport from "passport";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";

import "./config/passport.js";
import authRoutes from "./routes/auth.routes.js";
import roleRouter from "./routes/role.routes.js";
import userRouter from "./routes/user.routes.js";
import jobRouter from "./routes/job.routes.js";
import applicationRouter from "./routes/application.routes.js";
import profileRouter from "./routes/profile.routes.js";
import rubricRouter from "./routes/rubric.routes.js";
import rqaRouter from "./routes/rqa.routes.js";
import analyticsRouter from "./routes/analytics.routes.js";
import appointmentRouter from "./routes/appointment.routes.js";
import settingsRouter from "./routes/settings.routes.js";
import interviewRouter from "./routes/interview.routes.js";
import notificationRouter from "./routes/notification.routes.js";
import auditRouter from "./routes/audit.routes.js";
import searchRouter from "./routes/search.routes.js";
import pdsRouter from "./routes/pds.routes.js";
import bulkRouter from "./routes/bulk.routes.js";
import announcementRouter from "./routes/announcement.routes.js";
import jobTemplateRouter from "./routes/jobTemplate.routes.js";
import resourceRouter from "./routes/resource.routes.js";
import errorMiddleware from "./middlewares/error.middleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost",
  "http://127.0.0.1",
  "http://localhost:5173",
  "http://127.0.0.1:5173"
].filter(Boolean);

// Extract the Vercel project base hostname (e.g. "myapp-rms-8f5l") to allow
// all preview deployment URLs for the same project (*.vercel.app subdomains).
const vercelProjectBase = process.env.CLIENT_URL?.includes('vercel.app')
  ? new URL(process.env.CLIENT_URL).hostname.split('.')[0]  // "myapp-rms-8f5l"
  : null;

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || process.env.NODE_ENV !== 'production') return callback(null, true);

      // Exact match
      if (allowedOrigins.includes(origin)) return callback(null, true);

      try {
        const requestHost = new URL(origin).hostname;

        // Allow all Vercel preview URLs for this project (same base slug)
        if (vercelProjectBase && requestHost.endsWith('.vercel.app') &&
            requestHost.startsWith(vercelProjectBase)) {
          return callback(null, true);
        }

        // Allow localhost variants
        if (requestHost === 'localhost' || requestHost === '127.0.0.1') {
          return callback(null, true);
        }
      } catch (_) { /* invalid origin URL */ }

      console.warn(`[CORS Blocked] Origin: ${origin} | Expected: ${process.env.CLIENT_URL}`);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }),
);

app.use(
  "/uploads",
  express.static(path.join(__dirname, "..", "public", "uploads")),
);

// Security & Parsing
app.use(express.json({ limit: "5mb" }));
app.use(cookieParser());
app.use(mongoSanitize());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "guih_ranking_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 60,
    },
  }),
);

app.use(passport.initialize());
app.use(passport.session());

app.get("/health", (req, res) => res.status(200).send("Server is healthy"));

app.use("/api/auth", authRoutes);
app.use("/api/v1/roles", roleRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/jobs", jobRouter);
app.use("/api/v1/applications", applicationRouter);
app.use("/api/v1/profile", profileRouter);
app.use("/api/v1/rubrics", rubricRouter);
app.use("/api/v1/rqa", rqaRouter);
app.use("/api/v1/analytics", analyticsRouter);
app.use("/api/v1/appointments", appointmentRouter);
app.use("/api/v1/settings", settingsRouter);
app.use("/api/v1/interviews", interviewRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/audit-logs", auditRouter);
app.use("/api/v1/search", searchRouter);
app.use("/api/v1/pds", pdsRouter);
app.use("/api/v1/bulk", bulkRouter);
app.use("/api/v1/announcements", announcementRouter);
app.use("/api/v1/job-templates", jobTemplateRouter);
app.use("/api/v1/resources", resourceRouter);

// Serve Vue 3 SPA (production build)
const clientDist = path.join(__dirname, "../../client/dist");
app.use(express.static(clientDist));
app.get("*", (req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

app.use(errorMiddleware);

export default app;
