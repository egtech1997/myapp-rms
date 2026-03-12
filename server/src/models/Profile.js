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
      enum: ["male", "female", "prefer_not_to_say", "LGBTQ+"],
    },
    birthDate: Date,
    isIndigenous: { type: Boolean, default: false },
    isSoloParent: { type: Boolean, default: false },
    religion: String,
    disability: String,
    civilStatus: {
      type: String,
      enum: ["Single", "Married", "Widowed", "Separated", "Other"],
    },

    // --- Identification Numbers ---
    gsisNo: String,
    pagibigNo: String,
    philhealthNo: String,
    tinNo: String,
    philSysNo: String,
    agencyEmployeeNo: String,

    // --- Contact & Address ---
    contact: {
      phones: [{ type: String, trim: true }],
      emails: [{ type: String, trim: true, lowercase: true }],
    },
    currentAddress: {
      sitio: String,
      barangay: String,
      municipality: String,
      city: String,
      province: String,
      zipCode: String,
      country: { type: String, default: "Philippines" },
    },
    comelecAddress: {
      sitio: String,
      barangay: String,
      municipality: String,
      city: String,
      province: String,
      zipCode: String,
      country: { type: String, default: "Philippines" },
      document: String, // Path to uploaded Comelec ID or Certificate
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
        type:           { type: String, trim: true }, // category (e.g. "Career Service (Professional)")
        name:           { type: String, trim: true }, // specific exam title / license name
        rating:         { type: String, trim: true },
        dateOfExam:     Date,
        placeOfExam:    { type: String, trim: true },
        licenseNumber:  String,
        licenseValidity: Date,
        document:       String, // Path to uploaded license/rating certificate
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
        status: { 
          type: String, 
          default: "Graduated" 
        }, // e.g. Graduated, CAR, Units Earned, Associate
        unitsEarned: String,
        yearGraduated: String,
        honorsReceived: String,
        diploma: String, // Path to uploaded diploma
        tor: String,     // Path to uploaded transcript of records
      },
    ],

    // --- Training (Learning & Development) ---
    training: [
      {
        title: { type: String, required: true },
        dateIssued: Date,
        hours: { type: Number, required: true },
        typeOfLD: { type: String, enum: ["Technical", "Managerial", "Supervisory", "Academic", "Foundation", "Other"] },
        provider: String,
        document: String, // Path to uploaded training certificate
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
        serviceType: { type: String, enum: ["Government", "Private", "Self-Employed"], default: "Private" },
        companyEmail: String,
        companyPhone: String,
        keyResponsibilities: [{ type: String }],
        document: String, // Path to uploaded Certificate of Employment
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

    // --- PDS Questions (Queries) ---
    pdsQuestions: {
      q34a: { type: Boolean, default: false },
      q34b: { type: Boolean, default: false },
      q35a: { type: Boolean, default: false },
      q35b: { type: Boolean, default: false },
      q36:  { type: Boolean, default: false },
      q37:  { type: Boolean, default: false },
      q38a: { type: Boolean, default: false },
      q38b: { type: Boolean, default: false },
      q39:  { type: Boolean, default: false },
      q40a: { type: Boolean, default: false },
      q40b: { type: Boolean, default: false },
      q40c: { type: Boolean, default: false },
      // details for 'Yes' answers
      q34_details: String,
      q35_details: String,
      q36_details: String,
      q37_details: String,
      q38_details: String,
      q39_details: String,
      q40_details: String,
    },

    // --- References ---
    references: [{
      name: String,
      address: String,
      phone: String,
    }],

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
