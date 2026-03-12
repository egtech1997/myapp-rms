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

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      
      // Check if origin is exactly in our list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Dynamic check: Allow if it matches the same IP/Host as CLIENT_URL 
      // even if the port or protocol varies slightly (e.g. http vs https)
      const clientUrlHost = process.env.CLIENT_URL ? new URL(process.env.CLIENT_URL).hostname : null;
      const requestHost = new URL(origin).hostname;

      if (requestHost === clientUrlHost || requestHost === 'localhost' || requestHost === '127.0.0.1') {
        callback(null, true);
      } else {
        console.warn(`[CORS Blocked] Origin: ${origin} | Expected: ${process.env.CLIENT_URL}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }),
);

app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "public", "uploads")),
);

// Security & Parsing
app.use(express.json({ limit: "5mb" }));
app.use(cookieParser());
app.use(mongoSanitize());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "gnc_oras_secret",
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

app.all("*", (req, res, next) => {
  res.status(404).json({
    status: "fail",
    message: `Can't find ${req.originalUrl} on this server!`,
  });
});

app.use(errorMiddleware);

export default app;
