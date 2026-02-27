import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import passport from "passport";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";

// Config & Routes
import "./config/passport.js";
import authRoutes from "./routes/auth.routes.js";
import errorMiddleware from "./middlewares/error.middleware.js";

// Setup __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/**
 * 1. GLOBAL MIDDLEWARES
 */

// CORS: Must match your Vue 3 / Vite dev server URL
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);

// Static Files: Serving uploaded avatars
// Accessible via http://localhost:4000/uploads/avatars/filename.jpg
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "public", "uploads")),
);

// Security & Parsing
app.use(express.json({ limit: "10kb" })); // Body limit to prevent DOS
app.use(cookieParser());
app.use(mongoSanitize()); // Prevent NoSQL Injection

/**
 * 2. SESSION & AUTHENTICATION
 * Even though we use JWT Cookies, Passport Google Strategy
 * often requires a temporary session during the redirect flow.
 */
app.use(
  session({
    secret: process.env.SESSION_SECRET || "gnc_oras_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 60, // 1 hour
    },
  }),
);

app.use(passport.initialize());
app.use(passport.session());

/**
 * 3. ROUTES
 */

// Health Check
app.get("/health", (req, res) => res.status(200).send("Server is healthy"));

// Auth & User Routes
app.use("/api/auth", authRoutes);

// 404 Handler for undefined routes
app.all("*", (req, res, next) => {
  res.status(404).json({
    status: "fail",
    message: `Can't find ${req.originalUrl} on this server!`,
  });
});

/**
 * 4. GLOBAL ERROR HANDLING
 */
app.use(errorMiddleware);

export default app;
