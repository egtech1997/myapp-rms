import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    let token = req.cookies.token;

    // 1. Check if token is missing OR is a 'broken' string like "undefined"
    if (!token || token === "undefined" || token === "null") {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 2. Fetch user and populate role
    const user = await User.findById(decoded.id).populate("role");

    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    req.user = user;
    next();
  } catch (error) {
    // This will now only trigger for real issues (expired or tampered tokens)
    console.error("Auth Middleware Error:", error.message);
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};

export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role?.permissions?.includes(permission)) {
      return res
        .status(403)
        .json({ message: "Forbidden: Insufficient permissions" });
    }
    next();
  };
};

export const restrictTo = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role?.name)) {
      return res.status(403).json({
        message:
          "Access Denied: You do not have permission to perform this action.",
      });
    }
    next();
  };
};
