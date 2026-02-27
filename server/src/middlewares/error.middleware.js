import multer from "multer";

const errorMiddleware = (err, req, res, next) => {
  // Default values
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let status = err.status || "error";

  // 1. MongoDB Duplicate Key (e.g., Email already exists)
  if (err.code === 11000) {
    statusCode = 400;
    status = "fail";
    const field = Object.keys(err.keyValue)[0];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`;
  }

  // 2. Mongoose Validation Errors
  if (err.name === "ValidationError") {
    statusCode = 400;
    status = "fail";
    // Combine all validation messages into one string
    message = Object.values(err.errors)
      .map((el) => el.message)
      .join(". ");
  }

  // 3. Mongoose CastError (e.g., Invalid ID format)
  if (err.name === "CastError") {
    statusCode = 400;
    status = "fail";
    message = `Invalid ${err.path}: ${err.value}.`;
  }

  // 4. JWT Errors (Invalid or Expired tokens)
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    status = "fail";
    message = "Invalid token. Please log in again.";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    status = "fail";
    message = "Your session has expired. Please log in again.";
  }

  // 5. Multer-specific errors
  if (err instanceof multer.MulterError) {
    statusCode = 400;
    status = "fail";
    if (err.code === "LIMIT_FILE_SIZE") {
      message = "File is too large. Max limit is 5MB.";
    }
  }

  // Log errors in development for the dev team
  if (process.env.NODE_ENV === "development") {
    console.error("💥 ERROR:", err);
  }

  res.status(statusCode).json({
    status: status,
    message: message,
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
      error: err,
    }),
  });
};

export default errorMiddleware;
