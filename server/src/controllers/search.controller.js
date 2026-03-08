import Application from "../models/Application.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";
import { logAction } from "../services/audit.service.js";

// ── 1. Advanced Search (Global) ───────────────────────────────────────────
export const advancedSearch = catchAsync(async (req, res) => {
  const { 
    q, 
    educationLevel, 
    minExperience, 
    status, 
    jobId,
    page = 1, 
    limit = 20 
  } = req.query;

  const query = {};

  // 1. Text Search (Keyword)
  if (q) {
    query.$text = { $search: q };
  }

  // 2. Education Level Filter
  if (educationLevel) {
    query["applicantData.education.level"] = educationLevel;
  }

  // 3. Status Filter
  if (status) {
    query.status = status;
  }

  // 4. Job Filter
  if (jobId) {
    query.submittedTo = jobId;
  }

  const skip = (page - 1) * limit;

  // 5. Build Aggregation for Advanced Sorting & Scoring
  const pipeline = [
    { $match: query },
    // If text search, sort by relevance score
    ...(q ? [{ $addFields: { score: { $meta: "textScore" } } }, { $sort: { score: { $meta: "textScore" } } }] : [{ $sort: { createdAt: -1 } }]),
    { $skip: skip },
    { $limit: Number(limit) },
    {
      $lookup: {
        from: "jobs",
        localField: "submittedTo",
        foreignField: "_id",
        as: "job"
      }
    },
    { $unwind: "$job" },
    {
      $lookup: {
        from: "users",
        localField: "submittedBy",
        foreignField: "_id",
        as: "applicant"
      }
    },
    { $unwind: "$applicant" }
  ];

  const results = await Application.aggregate(pipeline);
  const total = await Application.countDocuments(query);

  // 🛡️ Audit Log the search query
  if (q) {
    logAction({
      req,
      action: "ADVANCED_SEARCH",
      entityModel: "Application",
      entityId: req.user._id, // Actor context
      description: `Performed keyword search: "${q}"`
    });
  }

  res.status(200).json({
    status: "success",
    total,
    page: Number(page),
    data: results
  });
});

// ── 2. Get Search Suggestions (Autocomplete) ──────────────────────────────
export const getSuggestions = catchAsync(async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.status(200).json({ status: "success", data: [] });

  // Simplified autocomplete using regex on specific fields
  const suggestions = await Application.find({
    $or: [
      { "applicantData.personalInfo.lastName": { $regex: q, $options: "i" } },
      { "applicationCode": { $regex: q, $options: "i" } }
    ]
  })
  .limit(5)
  .select("applicantData.personalInfo.firstName applicantData.personalInfo.lastName applicationCode")
  .lean();

  const formatted = suggestions.map(s => ({
    text: `${s.applicantData.personalInfo.firstName} ${s.applicantData.personalInfo.lastName} (${s.applicationCode})`,
    id: s._id
  }));

  res.status(200).json({ status: "success", data: formatted });
});
