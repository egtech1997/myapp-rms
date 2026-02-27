import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    let token = req.cookies.token;
    if (!token || token === "undefined") {
      return res.status(401).json({ message: "Not authorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).populate("roles");

    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    // NEW: Check if password was changed after token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        message: "User recently changed password! Please log in again.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Not authorized" });
  }
};

export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user || !req.user.roles) {
      return res.status(403).json({ message: "Forbidden: No roles found" });
    }

    const hasPermission = req.user.roles.some((role) =>
      role.permissions?.includes(permission),
    );

    if (!hasPermission) {
      return res
        .status(403)
        .json({ message: "Forbidden: Insufficient permissions" });
    }
    next();
  };
};

export const restrictTo = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.roles) {
      return res.status(403).json({ message: "Access Denied" });
    }

    const userRoleNames = req.user.roles.map((role) => role.name);
    const hasRole = allowedRoles.some((role) => userRoleNames.includes(role));

    if (!hasRole) {
      return res.status(403).json({
        message:
          "Access Denied: You do not have permission to perform this action.",
      });
    }
    next();
  };
};
