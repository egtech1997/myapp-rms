import crypto from "crypto";

/**
 * Service to handle generation and hashing of One-Time Passwords
 */
export const generateOTP = () => {
  // Generate a random 6-digit string
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Set expiry for 10 minutes from now
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  return { otp, expiresAt };
};

/**
 * Hashes the raw OTP so we don't store plain text in the database
 */
export const hashOTP = (otp) => {
  return crypto.createHash("sha256").update(otp).digest("hex");
};

/**
 * Compares a provided OTP with the stored hashed OTP
 */
export const verifyOTP = (providedOtp, storedHashedOtp) => {
  const hashedProvided = hashOTP(providedOtp);
  return hashedProvided === storedHashedOtp;
};
