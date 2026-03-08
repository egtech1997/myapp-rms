import Announcement from "../models/Announcement.js";
import Application from "../models/Application.js";
import Job from "../models/Job.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";

// ── 1. Create IER Announcement ───────────────────────────────────────────
export const createIerAnnouncement = catchAsync(async (req, res, next) => {
  const { jobId } = req.body;

  const job = await Job.findById(jobId);
  if (!job) return next(new AppError("Job not found", 404));

  const apps = await Application.find({ submittedTo: jobId })
    .populate("submittedBy", "name username")
    .lean();

  const qualified = apps.filter(a => a.isQualified);
  const disqualified = apps.filter(a => !a.isQualified);

  const title = `Initial Evaluation Result: ${job.positionTitle} (${job.positionCode})`;
  
  let content = `<p>This is to announce the Initial Evaluation Results for the position of <strong>${job.positionTitle}</strong>.</p>`;
  
  content += `<h3>Qualified Applicants (Ready for Assessment)</h3><ul>`;
  qualified.forEach(a => {
    const name = a.submittedBy.name ? `${a.submittedBy.name.lastName}, ${a.submittedBy.name.firstName}` : a.submittedBy.username;
    content += `<li>${name.toUpperCase()} (${a.applicationCode})</li>`;
  });
  content += `</ul>`;

  if (disqualified.length > 0) {
    content += `<h3>Disqualified Applicants</h3><ul>`;
    disqualified.forEach(a => {
      const name = a.submittedBy.name ? `${a.submittedBy.name.lastName}, ${a.submittedBy.name.firstName}` : a.submittedBy.username;
      content += `<li>${name.toUpperCase()} - Reason: ${a.disqualificationReason || 'Does not meet minimum requirements'}</li>`;
    });
    content += `</ul>`;
  }

  content += `<p>For those qualified, please wait for the official notification regarding your assessment schedule.</p>`;

  const announcement = await Announcement.create({
    title,
    content,
    type: "ier_release",
    job: jobId,
    postedBy: req.user._id
  });

  res.status(201).json({ status: "success", data: announcement });
});

// ── 2. Get Public Announcements ──────────────────────────────────────────
export const getPublicAnnouncements = catchAsync(async (req, res) => {
  const data = await Announcement.find({ status: "published" })
    .sort("-createdAt")
    .limit(20);
  res.status(200).json({ status: "success", data });
});

// ── 3. Get All Announcements (Admin) ─────────────────────────────────────
export const getAllAnnouncements = catchAsync(async (req, res) => {
  const data = await Announcement.find()
    .populate("postedBy", "username")
    .sort("-createdAt");
  res.status(200).json({ status: "success", data });
});

// ── 4. Create Announcement (Admin) ───────────────────────────────────────
export const createAnnouncement = catchAsync(async (req, res, next) => {
  const { title, content, status, expiryDate } = req.body;
  if (!title || !content) return next(new AppError("Title and content are required.", 400));

  const announcement = await Announcement.create({
    title,
    content,
    type: "general",
    status: status || "published",
    expiryDate: expiryDate || null,
    postedBy: req.user._id,
  });
  res.status(201).json({ status: "success", data: announcement });
});

// ── 5. Update Announcement (Admin) ───────────────────────────────────────
export const updateAnnouncement = catchAsync(async (req, res, next) => {
  const { title, content, status, expiryDate } = req.body;
  const announcement = await Announcement.findByIdAndUpdate(
    req.params.id,
    { title, content, status, expiryDate },
    { new: true, runValidators: true }
  );
  if (!announcement) return next(new AppError("Announcement not found.", 404));
  res.status(200).json({ status: "success", data: announcement });
});

// ── 6. Delete Announcement (Admin) ───────────────────────────────────────
export const deleteAnnouncement = catchAsync(async (req, res, next) => {
  const announcement = await Announcement.findByIdAndDelete(req.params.id);
  if (!announcement) return next(new AppError("Announcement not found.", 404));
  res.status(204).json({ status: "success", data: null });
});
