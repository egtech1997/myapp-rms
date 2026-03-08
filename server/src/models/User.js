import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, select: false },
    googleId: { type: String, unique: true, sparse: true },
    avatar: { type: String },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    roles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Role",
      },
    ],
    otp: { code: String, expiresAt: Date },
    passwordResetToken: String,
    passwordResetExpires: Date,
    lastLogin: Date,
    passwordChangedAt: Date,
    bio: { type: String, maxlength: 240 },
    links: {
      facebook: { type: String, trim: true },
      linkedin: { type: String, trim: true },
      twitter:  { type: String, trim: true },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

userSchema.virtual("avatarUrl").get(function () {
  if (!this.avatar) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      this.username,
    )}&background=E2E8F0&color=334155&bold=true`;
  }

  if (this.avatar.startsWith("http")) {
    return this.avatar;
  }

  const baseUrl = process.env.BACKEND_URL || "http://localhost:4000";
  return `${baseUrl.replace(/\/$/, "")}/${this.avatar.replace(/^\//, "")}`;
});

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  if (!this.password) return;

  this.password = await bcrypt.hash(this.password, 12);

  if (!this.isNew) {
    this.passwordChangedAt = Date.now() - 1000;
  }
});

userSchema.methods.comparePassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

userSchema.pre("findOneAndDelete", async function () {
  const query = this.getQuery();
  const user = await this.model.findOne(query);

  if (
    user &&
    (user.username === "super_admin" ||
      user.email === "superadmin@deped.gov.ph")
  ) {
    throw new Error("This is a protected system account and cannot be deleted.");
  }
});
export default mongoose.model("User", userSchema);
