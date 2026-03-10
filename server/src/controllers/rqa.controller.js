import mongoose from "mongoose";
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

  // 1. Fetch only evaluated/ranked applications
  const apps = await Application.find({ 
    submittedTo: jobId, 
    status: "ranked" 
  }).populate("submittedBy");

  if (apps.length === 0) {
    return next(new AppError("No evaluated applicants found. Please finalize scores first.", 400));
  }

  // 2. Fetch Job Rubric for dynamic mapping
  const rubric = await mongoose.model("Rubric").findOne({ category: job.hiringTrack });

  // 3. Map data to CAL rankings structure
  const rankings = apps.map(app => {
    const p = app.applicantData.personalInfo;
    const fullName = [p.firstName, p.middleName, p.lastName, p.suffix].filter(Boolean).join(" ");
    
    // Check residency: strict matching of Municipality/City
    const isResident = p.address?.municipality?.toLowerCase() === job.placeOfAssignment?.toLowerCase();

    const rankingEntry = {
      application: app._id,
      applicantName: fullName,
      totalPoints: app.totalScore,
      residencyPriority: isResident,
      
      // Standard tie-breaker keys (will be filled if present in hrRating)
      educationPoints:  app.hrRating?.educationPoints  || 0,
      trainingPoints:   app.hrRating?.trainingPoints   || 0,
      experiencePoints:  app.hrRating?.experiencePoints  || 0,
      performancePoints: app.hrRating?.performancePoints || 0,
      boardRating:      app.hrRating?.boardRating      || 0,
      coiPoints:        app.hrRating?.coiPoints        || 0,
    };

    return rankingEntry;
  });

  // 4. Upsert CAL record
  let cal = await CAL.findOne({ job: jobId });
  if (!cal) {
    cal = new CAL({ job: jobId, rankings, hiringTrack: job.hiringTrack });
  } else {
    cal.rankings = rankings;
  }

  // Trigger pre-save hook for sorting/ranking (handled in CAL model)
  await cal.save();

  res.status(200).json({ status: "success", data: cal });
});
