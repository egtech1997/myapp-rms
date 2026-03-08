import Appointment from "../models/Appointment.js";
import Application from "../models/Application.js";
import Job from "../models/Job.js";
import CAL from "../models/CAL.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";
import { logAction } from "../services/audit.service.js";
import { generateCS33Form } from "../services/report.service.js";
import Notification from "../models/Notification.js";
import { sendEmail } from "../services/email.service.js";

// ── 1. Get Selection Pool (Top Ranked Applicants) ──────────────────────────
export const getSelectionPool = catchAsync(async (req, res, next) => {
  const { jobId } = req.params;
  
  const cal = await CAL.findOne({ job: jobId })
    .populate({
      path: "rankings.application",
      populate: { path: "submittedBy", select: "username name email" }
    });
    
  if (!cal) return next(new AppError("No ranking found for this job", 404));
  
  res.status(200).json({ status: "success", data: cal });
});

// ── 2. Issue Appointment (The SDS selects a candidate) ─────────────────────
export const appointCandidate = catchAsync(async (req, res, next) => {
  const { 
    applicationId, 
    nature, 
    status, 
    effectiveDate, 
    salary,
    formMetadata
  } = req.body;

  const application = await Application.findById(applicationId)
    .populate("submittedBy")
    .populate("submittedTo");

  if (!application) return next(new AppError("Application not found", 404));
  
  // 1. Check if already appointed
  const existing = await Appointment.findOne({ application: applicationId });
  if (existing) return next(new AppError("Candidate already appointed for this application", 400));

  // 2. Create Appointment Document
  const appointment = await Appointment.create({
    application: applicationId,
    appointee: application.submittedBy._id,
    job: application.submittedTo._id,
    nature,
    status,
    salary: salary || application.submittedTo.salary,
    effectiveDate,
    formMetadata,
    issuedBy: req.user._id
  });

  // 3. Update Application & Job Status
  application.status = "appointed";
  await application.save();
  
  // 4. Log Action (Audit)
  logAction({
    req,
    action: "APPOINTMENT_ISSUED",
    entityModel: "Application",
    entityId: applicationId,
    after: appointment.toObject(),
    severity: "critical",
    description: `Issued ${nature} appointment to ${application.submittedBy.username} for ${application.submittedTo.positionTitle}`
  });

  // 5. Trigger Notification & Email
  const title = "CONGRATULATIONS: Appointment Issued";
  const message = `We are pleased to inform you that you have been appointed as ${application.submittedTo.positionTitle}. Your official CS Form 33-A (Appointment Form) is ready for download.`;
  
  await Notification.create({
    recipient: application.submittedBy._id,
    application: applicationId,
    title,
    message,
    type: "ranking_release",
    metadata: { appointmentId: appointment._id }
  });

  const emailHtml = `
    <h2>Congratulations!</h2>
    <p>We are delighted to inform you that your appointment as <strong>${application.submittedTo.positionTitle}</strong> has been officially signed.</p>
    <p>Effective Date: ${new Date(effectiveDate).toLocaleDateString()}</p>
    <p>Status: ${status.toUpperCase()}</p>
    <p>Please log in to the RSP Portal to download your official Appointment Form (CS Form 33-A).</p>
  `;

  sendEmail({ 
    email: application.submittedBy.email, 
    subject: `[CONGRATULATIONS] Appointment Issued - ${application.submittedTo.positionTitle}`, 
    html: emailHtml 
  });

  res.status(201).json({ status: "success", data: appointment });
});

// ── 3. Export CS Form 33-A ────────────────────────────────────────────────
export const exportAppointmentForm = catchAsync(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate("appointee")
    .populate({
      path: "application",
      populate: { path: "submittedTo" }
    });

  if (!appointment) return next(new AppError("Appointment record not found", 404));

  const pdfDoc = generateCS33Form(appointment);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=CS-FORM-33-A-${appointment.appointee.username}.pdf`);

  pdfDoc.pipe(res);
  pdfDoc.end();
});
