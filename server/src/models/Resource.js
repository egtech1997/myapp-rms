import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required."],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters."],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters."],
    },
    category: {
      type: String,
      enum: ["form", "memo", "circular", "order", "guideline", "other"],
      default: "other",
    },
    filePath: {
      type: String,
      required: [true, "File path is required."],
    },
    originalName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
    },
    mimeType: {
      type: String,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

resourceSchema.index({ category: 1 });
resourceSchema.index({ isPublished: 1 });
resourceSchema.index({ createdAt: -1 });
resourceSchema.index({ title: "text", description: "text" });

const Resource = mongoose.model("Resource", resourceSchema);
export default Resource;
