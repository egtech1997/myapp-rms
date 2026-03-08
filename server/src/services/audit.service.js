import AuditLog from "../models/AuditLog.js";

/**
 * 🔹 ASYNC LOGGING SERVICE
 * This will run without blocking the main event loop.
 */
export const logAction = async ({ 
  req, 
  action, 
  entityModel, 
  entityId, 
  before = {}, 
  after = {}, 
  severity = "low", 
  description 
}) => {
  try {
    const actorId = req?.user?._id;
    const ipAddress = req?.ip || req?.headers?.["x-forwarded-for"] || "127.0.0.1";
    const userAgent = req?.headers?.["user-agent"];

    if (!actorId) return; // Only log actions by authenticated users

    // Extract only changed fields for the diff
    const beforeDiff = {};
    const afterDiff = {};

    Object.keys(after).forEach(key => {
      // Basic check for changes
      if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
        beforeDiff[key] = before[key];
        afterDiff[key] = after[key];
      }
    });

    // Create log entry asynchronously
    AuditLog.create({
      action,
      actor: actorId,
      entityModel,
      entityId,
      diff: {
        before: beforeDiff,
        after: afterDiff
      },
      severity,
      ipAddress,
      userAgent,
      description
    });
  } catch (error) {
    console.error("❌ AUDIT_LOGGER_ERROR:", error.message);
    // Note: Do not throw error here, as we don't want to crash the main transaction
  }
};

export default { logAction };
