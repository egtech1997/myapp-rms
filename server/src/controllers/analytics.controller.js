import Application from "../models/Application.js";
import Job from "../models/Job.js";
import User from "../models/User.js";
import CAL from "../models/CAL.js";
import Appointment from "../models/Appointment.js";
import catchAsync from "../utils/catchAsync.js";
import { logAction } from "../services/audit.service.js";

// ── 1. Overview Analytics ────────────────────────────────────────────────
export const getOverview = catchAsync(async (req, res) => {
  const [jobCount, appCount, userCount, apptCount] = await Promise.all([
    Job.countDocuments(),
    Application.countDocuments(),
    User.countDocuments(),
    Appointment.countDocuments()
  ]);

  const statusDistribution = await Application.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } }
  ]);

  const hiringTrackDistribution = await Job.aggregate([
    { $group: { _id: "$hiringTrack", count: { $sum: 1 } } }
  ]);

  logAction({
    req,
    action: "ANALYTICS_VIEW",
    entityModel: "Application",
    entityId: req.user._id,
    description: "Accessed Overview Analytics"
  });

  res.status(200).json({
    status: "success",
    data: {
      metrics: {
        totalJobs: jobCount,
        totalApplications: appCount,
        totalUsers: userCount,
        totalAppointments: apptCount
      },
      statusDistribution,
      hiringTrackDistribution
    }
  });
});

// ── 2. Time-based Trends ──────────────────────────────────────────────────
export const getTrends = catchAsync(async (req, res) => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const appTrends = await Application.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
        count: { $sum: 1 }
      }
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } }
  ]);

  const apptTrends = await Appointment.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
        count: { $sum: 1 }
      }
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } }
  ]);

  res.status(200).json({
    status: "success",
    data: { appTrends, apptTrends }
  });
});

// ── 3. Demographics Breakdown ─────────────────────────────────────────────
export const getDemographics = catchAsync(async (req, res) => {
  // Breakdown by Sex
  const sexDist = await Application.aggregate([
    { $group: { _id: "$applicantData.personalInfo.sex", count: { $sum: 1 } } }
  ]);

  // Breakdown by Education Level
  const eduDist = await Application.aggregate([
    { $unwind: "$applicantData.education" },
    { $group: { _id: "$applicantData.education.level", count: { $sum: 1 } } }
  ]);

  // Breakdown by Ethnic Group
  const ethnicDist = await Application.aggregate([
    { $group: { _id: "$applicantData.personalInfo.ethnicGroup", count: { $sum: 1 } } }
  ]);

  // Breakdown by Religion
  const religionDist = await Application.aggregate([
    { $group: { _id: "$applicantData.personalInfo.religion", count: { $sum: 1 } } }
  ]);

  // Breakdown by Disability
  const disabilityDist = await Application.aggregate([
    { $group: { _id: "$applicantData.personalInfo.disability", count: { $sum: 1 } } }
  ]);

  res.status(200).json({
    status: "success",
    data: { sexDist, eduDist, ethnicDist, religionDist, disabilityDist }
  });
});

// ── 4. Processing Efficiency (Bottleneck Analysis) ────────────────────────
export const getEfficiency = catchAsync(async (req, res) => {
  // Compute average duration between status changes
  // Note: This requires specific timestamps for each status change which 
  // might be in AuditLog or we can estimate from createdAt/updatedAt/verifiedAt
  const efficiency = await Application.aggregate([
    { $match: { isVerified: true, verifiedAt: { $exists: true } } },
    {
      $project: {
        verificationDays: {
          $divide: [
            { $subtract: ["$verifiedAt", "$createdAt"] },
            1000 * 60 * 60 * 24
          ]
        }
      }
    },
    {
      $group: {
        _id: null,
        avgVerificationDays: { $avg: "$verificationDays" }
      }
    }
  ]);

  res.status(200).json({
    status: "success",
    data: efficiency[0] || { avgVerificationDays: 0 }
  });
});
