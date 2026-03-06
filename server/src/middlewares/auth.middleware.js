import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    let token = req.cookies.token;

    if (!token || token === "undefined" || token === "null") {
      return res
        .status(401)
        .json({ message: "Not authorized: No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).populate("roles");

    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    if (user.changedPasswordAfter && user.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        message: "User recently changed password! Please log in again.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Not authorized: Invalid token" });
  }
};

export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user || !req.user.roles) {
      return res.status(403).json({ message: "Forbidden: No roles found" });
    }

    // 1. Bypass by Role Name (Your existing logic)
    const isSuperAdmin = req.user.roles.some(
      (role) => role.name === "super_admin" || role.name === "Super Admin",
    );
    if (isSuperAdmin) return next();

    // 2. NEW: Bypass by "all" permission (Matches your Vue frontend logic)
    const hasWildcard = req.user.roles.some((role) =>
      role.permissions?.includes("all"),
    );
    if (hasWildcard) return next();

    // 3. Standard specific permission check
    const hasPermission = req.user.roles.some((role) =>
      role.permissions?.includes(permission),
    );

    if (!hasPermission) {
      return res.status(403).json({
        message: `Forbidden: Missing required permission [${permission}]`,
      });
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
        message: "Access Denied: High-level role required.",
      });
    }
    next();
  };
};
