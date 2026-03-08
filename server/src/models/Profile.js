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
    ethnicGroup: String,
    religion: String,
    civilStatus: {
      type: String,
      enum: ["Single", "Married", "Widowed", "Separated", "Other"],
    },

    // --- Contact & Address ---
    contact: {
      phones: [{ type: String, trim: true }],
      emails: [{ type: String, trim: true, lowercase: true }],
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

    // --- Family Background ---
    family: {
      spouse: {
        firstName: String, middleName: String, lastName: String, suffix: String,
        occupation: String, employer: String, businessAddress: String, phone: String,
      },
      father: { firstName: String, middleName: String, lastName: String, suffix: String },
      mother: { firstName: String, middleName: String, lastName: String, suffix: String },
      children: [{
        firstName: String, middleName: String, lastName: String, suffix: String,
        birthDate: Date,
      }],
    },

    // --- Eligibility ---
    eligibility: [
      {
        name: { type: String, trim: true },
        rating: { type: String, trim: true },
        dateOfExam: Date,
        placeOfExam: { type: String, trim: true },
        licenseNumber: String,
        licenseValidity: Date,
      },
    ],

    // --- Education ---
    education: [
      {
        level: {
          type: String,
          enum: ["Elementary", "Secondary", "Vocational", "Bachelor", "Masteral", "Doctorate"],
          required: true,
        },
        school: { type: String, required: true },
        degree: { type: String, required: true },
        periodFrom: String,
        periodTo: String,
        notGraduated: { type: Boolean, default: false },
        unitsEarned: Number,
        yearGraduated: Number,
        honorsReceived: String,
      },
    ],

    // --- Training (Learning & Development) ---
    training: [
      {
        title: { type: String, required: true },
        periodFrom: Date,
        periodTo: Date,
        hours: { type: Number, required: true },
        typeOfLD: { type: String, enum: ["Technical", "Managerial", "Supervisory", "Academic", "Foundation", "Other"] },
        provider: String,
      },
    ],

    // --- Work Experience ---
    experience: [
      {
        periodFrom: { type: Date, required: true },
        periodTo: Date, // Null if "Present"
        position: { type: String, required: true },
        company: { type: String, required: true },
        monthlySalary: Number,
        salaryGrade: String, // e.g., "11-1"
        statusOfAppointment: { type: String, enum: ["Permanent", "Temporary", "Coterminous", "Contractual", "Casual", "Job Order"] },
        isGovernment: { type: Boolean, default: false },
        keyResponsibilities: [{ type: String }],
      },
    ],

    // --- Voluntary Work ---
    voluntaryWork: [
      {
        organization: String,
        periodFrom: Date,
        periodTo: Date,
        hours: Number,
        position: String,
      },
    ],

    // --- Competencies & Skills ---
    competencies: [{ type: String }],
    specialSkills: [{ type: String }],
    nonAcademicDistinctions: [{ type: String }],
    memberships: [{ type: String }],

    performanceRating: {
      score: Number,
      adjective: String, // e.g., "Outstanding"
      periodCovered: String,
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
