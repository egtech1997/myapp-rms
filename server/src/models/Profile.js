import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      index: true,
      required: true,
    },

    // --- Basic Information ---
    name: {
      firstName: { type: String, required: true, trim: true },
      middleName: { type: String, trim: true },
      lastName: { type: String, required: true, trim: true },
      suffix: { type: String, trim: true },
    },
    sex: {
      type: String,
      enum: ["male", "female", "prefer_not_to_say"],
    },
    birthDate: Date,
    civilStatus: {
      type: String,
      enum: ["Single", "Married", "Widowed", "Separated", "Other"],
    },

    // --- Contact & Address ---
    contact: {
      phone: String,
      email: String,
    },
    address: {
      sitio: String,
      barangay: String,
      municipality: String,
      city: String,
      province: String,
      zipCode: String,
      country: { type: String, default: "Philippines" },
    },

    // --- HR Evidence (Snapshot Sources) ---
    education: [
      {
        level: {
          type: String,
          enum: ["Vocational", "Bachelor", "Masteral", "Doctorate"],
        },
        degree: String,
        units: Number,
        school: String,
        yearGraduated: Number,
      },
    ],

    training: [
      {
        title: String,
        hours: Number,
        dateIssued: Date,
        provider: String,
      },
    ],

    experience: [
      {
        position: String,
        company: String,
        months: Number,
        isGovernment: { type: Boolean, default: false },
        monthlySalary: Number,
      },
    ],

    performanceRating: {
      score: Number,
      adjective: String, // e.g., "Outstanding"
      periodCovered: String,
    },

    // --- Social & UI ---
    bio: { type: String, maxlength: 240 },
    links: {
      facebook: String,
      linkedin: String,
    },
    visibility: {
      phone: { type: Boolean, default: false },
      email: { type: Boolean, default: false },
      address: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

/**
 * VIRTUAL: Full Name
 */
profileSchema.virtual("fullName").get(function () {
  const { firstName, middleName, lastName, suffix } = this.name;
  const middleInitial = middleName ? `${middleName.charAt(0)}.` : "";
  return `${firstName} ${middleInitial} ${lastName} ${suffix || ""}`.trim();
});

/**
 * VIRTUAL: Current Age
 */
profileSchema.virtual("age").get(function () {
  if (!this.birthDate) return null;
  const today = new Date();
  const birth = new Date(this.birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
});

export default mongoose.model("Profile", profileSchema);
