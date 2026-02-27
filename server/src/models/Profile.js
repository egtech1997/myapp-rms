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

    name: {
      firstName: { type: String, required: true, trim: true },
      middleName: { type: String, trim: true },
      lastName: { type: String, required: true, trim: true },
      suffix: { type: String, trim: true }, // Jr, Sr, III
    },

    sex: {
      type: String,
      enum: ["male", "female", "prefer_not_to_say"],
    },

    birthDate: Date,

    contact: {
      phone: String,
      email: String, // Contact email (can be different from auth email)
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

    bio: { type: String, maxlength: 240 },

    links: {
      website: String,
      facebook: String,
      twitter: String,
      instagram: String,
      linkedin: String,
      github: String,
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
 * Useful for displaying "John D. Doe Jr." without concatenating strings in Vue
 */
profileSchema.virtual("fullName").get(function () {
  const { firstName, middleName, lastName, suffix } = this.name;
  const middleInitial = middleName ? `${middleName.charAt(0)}.` : "";
  return `${firstName} ${middleInitial} ${lastName} ${suffix || ""}`.trim();
});

export default mongoose.model("Profile", profileSchema);
