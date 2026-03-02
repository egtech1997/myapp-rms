class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true; // Marks the error as something we handled, not a bug

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
