import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import passport from "passport";
import session from "express-session";

import "./config/passport.js";
import authRoutes from "./routes/auth.routes.js";
import errorMiddleware from "./middlewares/error.middleware.js";

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// 🩹 EXPRESS 5 FIX: Make req.query writable so mongoSanitize doesn't crash!
app.use((req, res, next) => {
  Object.defineProperty(req, "query", {
    value: { ...req.query },
    writable: true,
    configurable: true,
    enumerable: true,
  });
  next();
});

// Now this is safe to run
app.use(mongoSanitize());

// Add Session Middleware
// This gives Passport a place to store the OAuth state temporarily
app.use(
  session({
    secret: process.env.SESSION_SECRET || "gnc_oras_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 15, // 15 minutes is plenty for login
    },
  }),
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/api/auth", authRoutes);

app.use(errorMiddleware);

export default app;
