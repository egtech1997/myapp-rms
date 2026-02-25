import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, select: false },
    googleId: { type: String, unique: true, sparse: true },
    avatar: { type: String },
    isVerified: { type: Boolean, default: false },
    role: { type: mongoose.Schema.Types.ObjectId, ref: "Role" },
    otp: { code: String, expiresAt: Date },
  },
  { timestamps: true },
);

// ✅ FIXED: Modern Async Hashing Middleware (No 'next' needed)
userSchema.pre("save", async function () {
  // Only run this if password was actually modified
  if (!this.isModified("password")) return;

  // Hash the password with a cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // No next() call required here
});

// Helper method to check password
userSchema.methods.comparePassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

export default mongoose.model("User", userSchema);
