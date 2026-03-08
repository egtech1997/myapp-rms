import CAL from "../models/CAL.js";
import Application from "../models/Application.js";
import Job from "../models/Job.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";
import { generateRQADoc } from "../services/report.service.js";

export const getRQA = catchAsync(async (req, res, next) => {
  const { jobId } = req.params;
  const cal = await CAL.findOne({ job: jobId }).populate("rankings.application");
  
  if (!cal) return next(new AppError("Ranking not found for this job", 404));
  
  res.status(200).json({ status: "success", data: cal });
});

export const exportRQA = catchAsync(async (req, res, next) => {
  const { jobId } = req.params;
  
  const job = await Job.findById(jobId);
  if (!job) return next(new AppError("Job not found", 404));

  const cal = await CAL.findOne({ job: jobId });
  if (!cal) return next(new AppError("RQA data not generated for this job yet", 404));

  const pdfDoc = generateRQADoc({
    job,
    rankings: cal.rankings,
    schoolYear: "2023-2024"
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=CAR-RQA-${job.positionCode}.pdf`);

  pdfDoc.pipe(res);
  pdfDoc.end();
});

export const generateRanking = catchAsync(async (req, res, next) => {
  const { jobId } = req.params;
  
  const job = await Job.findById(jobId);
  if (!job) return next(new AppError("Job not found", 404));

  // 1. Fetch all verified/evaluated applications for this job
  const apps = await Application.find({ 
    submittedTo: jobId, 
    status: { $in: ["comparative_assessment", "ranked"] } 
  }).populate("submittedBy");

  if (apps.length === 0) {
    return next(new AppError("No qualified applicants found to rank", 400));
  }

  // 2. Map data to CAL rankings structure
  const rankings = apps.map(app => ({
    application: app._id,
    applicantName: `${app.applicantData.personalInfo.firstName} ${app.applicantData.personalInfo.lastName}`,
    totalPoints: app.totalScore,
    // Extract tie-breaker points from hrRating
    educationPoints: app.hrRating.educationPoints || 0,
    experiencePoints: app.hrRating.experiencePoints || 0,
    trainingPoints: app.hrRating.trainingPoints || 0,
    boardRating: app.hrRating.potentialPoints.writtenTest || 0, // Sample mapping
    coiPoints: app.hrRating.potentialPoints.workSample || 0,
    residencyPriority: false, // Default, to be set by Admin manually if needed
  }));

  // 3. Upsert CAL record
  let cal = await CAL.findOne({ job: jobId });
  if (!cal) {
    cal = new CAL({ job: jobId, rankings, hiringTrack: job.hiringTrack });
  } else {
    cal.rankings = rankings;
  }

  // Trigger pre-save hook for sorting/ranking
  await cal.save();

  res.status(200).json({ status: "success", data: cal });
});
