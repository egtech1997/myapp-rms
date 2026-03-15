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

  // Only include applicants who have been verified
  const apps = await Application.find({ submittedTo: jobId, isVerified: true })
    .populate("submittedBy", "name username")
    .lean();

  if (apps.length === 0) {
    return next(new AppError("No verified applicants found for this job. Please audit records first.", 400));
  }

  const qualified = apps
    .filter(a => a.isQualified)
    .sort((a, b) => {
      const nameA = a.submittedBy.name ? `${a.submittedBy.name.lastName}, ${a.submittedBy.name.firstName}` : a.submittedBy.username;
      const nameB = b.submittedBy.name ? `${b.submittedBy.name.lastName}, ${b.submittedBy.name.firstName}` : b.submittedBy.username;
      return nameA.localeCompare(nameB);
    });

  const disqualified = apps
    .filter(a => !a.isQualified)
    .sort((a, b) => {
      const nameA = a.submittedBy.name ? `${a.submittedBy.name.lastName}, ${a.submittedBy.name.firstName}` : a.submittedBy.username;
      const nameB = b.submittedBy.name ? `${b.submittedBy.name.lastName}, ${b.submittedBy.name.firstName}` : b.submittedBy.username;
      return nameA.localeCompare(nameB);
    });

  const title = `Initial Evaluation Result (IER) for ${job.positionTitle} (${job.positionCode})`;
  
  let content = `
    <p>The Schools Division Office hereby announces the <strong>Initial Evaluation Results (IER)</strong> for the position of <strong>${job.positionTitle}</strong> under Item Number(s): ${job.itemNumbers?.join(', ') || 'N/A'}.</p>
    <p>After a thorough review and verification of submitted documents against the Qualification Standards (QS) set for the position, the following results have been established:</p>
  `;
  
  content += `<h3 style="color: #1d4ed8; border-bottom: 2px solid #1d4ed8; padding-bottom: 5px;">I. Qualified Applicants</h3>
    <p>The following applicants have met the minimum Qualification Standards and are eligible to proceed to the next stage of the assessment process:</p>
    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
      <thead>
        <tr style="background-color: #f8fafc; border: 1px solid #e2e8f0;">
          <th style="padding: 10px; text-align: left; border: 1px solid #e2e8f0; font-size: 12px;">#</th>
          <th style="padding: 10px; text-align: left; border: 1px solid #e2e8f0; font-size: 12px;">Name of Applicant</th>
          <th style="padding: 10px; text-align: left; border: 1px solid #e2e8f0; font-size: 12px;">Application Code</th>
        </tr>
      </thead>
      <tbody>`;
  
  if (qualified.length > 0) {
    qualified.forEach((a, i) => {
      const name = a.submittedBy.name ? `${a.submittedBy.name.lastName}, ${a.submittedBy.name.firstName}` : a.submittedBy.username;
      content += `
        <tr style="border: 1px solid #e2e8f0;">
          <td style="padding: 10px; border: 1px solid #e2e8f0;">${i + 1}</td>
          <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>${name.toUpperCase()}</strong></td>
          <td style="padding: 10px; border: 1px solid #e2e8f0; font-family: monospace;">${a.applicationCode}</td>
        </tr>`;
    });
  } else {
    content += `<tr><td colspan="3" style="padding: 20px; text-align: center; color: #64748b; font-style: italic;">No applicants met the minimum qualification standards.</td></tr>`;
  }
  content += `</tbody></table>`;

  if (disqualified.length > 0) {
    content += `<h3 style="color: #dc2626; border-bottom: 2px solid #dc2626; padding-bottom: 5px; margin-top: 30px;">II. Disqualified Applicants</h3>
      <p>The following applicants did not meet the minimum Qualification Standards for the position:</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <thead>
          <tr style="background-color: #fffaf0; border: 1px solid #fee2e2;">
            <th style="padding: 10px; text-align: left; border: 1px solid #fee2e2; font-size: 12px;">#</th>
            <th style="padding: 10px; text-align: left; border: 1px solid #fee2e2; font-size: 12px;">Name of Applicant</th>
            <th style="padding: 10px; text-align: left; border: 1px solid #fee2e2; font-size: 12px;">Reason / Remarks</th>
          </tr>
        </thead>
        <tbody>`;
    disqualified.forEach((a, i) => {
      const name = a.submittedBy.name ? `${a.submittedBy.name.lastName}, ${a.submittedBy.name.firstName}` : a.submittedBy.username;
      content += `
        <tr style="border: 1px solid #fee2e2;">
          <td style="padding: 10px; border: 1px solid #fee2e2;">${i + 1}</td>
          <td style="padding: 10px; border: 1px solid #fee2e2;"><strong>${name.toUpperCase()}</strong></td>
          <td style="padding: 10px; border: 1px solid #fee2e2; font-size: 11px; color: #991b1b;">${a.disqualificationReason || 'Does not meet minimum requirements / Incomplete documentation'}</td>
        </tr>`;
    });
    content += `</tbody></table>`;
  }

  content += `
    <div style="margin-top: 30px; padding: 15px; background-color: #eff6ff; border-radius: 8px; border: 1px solid #bfdbfe;">
      <p style="margin: 0; font-size: 13px; color: #1e40af;"><strong>Next Steps:</strong> Qualified applicants are advised to prepare for the Comparative Assessment stage. Individual notifications regarding the schedule of Behavioral Event Interview (BEI) and other assessments will be sent through the registered email addresses and the system portal.</p>
    </div>
    <p style="margin-top: 20px; font-size: 12px; color: #64748b; font-style: italic;">This announcement serves as the official Initial Evaluation Result (IER). Any queries or requests for clarification must be submitted to the HR Secretariat within three (3) working days from the date of posting.</p>
  `;

  // Upsert announcement: if one exists for this job and type, update it
  let announcement = await Announcement.findOne({ job: jobId, type: "ier_release" });
  if (announcement) {
    announcement.title = title;
    announcement.content = content;
    announcement.postedBy = req.user._id;
    announcement.status = "published";
    await announcement.save();
  } else {
    announcement = await Announcement.create({
      title,
      content,
      type: "ier_release",
      job: jobId,
      postedBy: req.user._id
    });
  }

  res.status(201).json({ status: "success", data: announcement });
});

// ── Helpers ───────────────────────────────────────────────────────────────
const UPLOADS_BASE = "/uploads/announcements/";

function mimeToFileType(mimetype = "") {
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype === "application/pdf") return "pdf";
  if (mimetype.includes("word")) return "word";
  if (mimetype.includes("excel") || mimetype.includes("spreadsheet")) return "excel";
  return "other";
}

function processUploadedFiles(req) {
  const files = req.files || {};
  const imageFile = (files.image || [])[0];
  const attachmentFiles = files.attachments || [];

  const imageUrl = imageFile
    ? `${UPLOADS_BASE}${imageFile.filename}`
    : undefined;

  const attachments = attachmentFiles.map((f) => ({
    fileName: f.originalname,
    fileUrl:  `${UPLOADS_BASE}${f.filename}`,
    fileType: mimeToFileType(f.mimetype),
    fileSize: f.size,
  }));

  return { imageUrl, attachments };
}

// ── Shared populate helper ────────────────────────────────────────────────
function populateAnnouncement(query) {
  return query
    .populate("postedBy", "username")
    .populate("job", "positionTitle positionCode")
    .populate("links.resourceId", "title filePath originalName mimeType fileSize")
    .populate("links.jobId", "positionTitle positionCode hiringTrack");
}

// ── 2. Get Public Announcements ──────────────────────────────────────────
export const getPublicAnnouncements = catchAsync(async (req, res) => {
  const query = Announcement.find({ status: "published" }).sort("-createdAt").limit(50);
  const data  = await populateAnnouncement(query).lean();
  res.status(200).json({ status: "success", data });
});

// ── 3. Get All Announcements (Admin) ─────────────────────────────────────
export const getAllAnnouncements = catchAsync(async (req, res) => {
  const query = Announcement.find().sort("-createdAt");
  const data  = await populateAnnouncement(query).lean();
  res.status(200).json({ status: "success", data });
});

// ── 4. Create Announcement (Admin) ───────────────────────────────────────
export const createAnnouncement = catchAsync(async (req, res, next) => {
  const {
    title, content, type, status, expiryDate,
    scheduledDate, scheduledTime, venue, job,
    existingAttachments, tags, links,
  } = req.body;

  if (!title || !content) return next(new AppError("Title and content are required.", 400));

  const { imageUrl, attachments } = processUploadedFiles(req);

  let combinedAttachments = attachments;
  if (existingAttachments) {
    try { combinedAttachments = [...JSON.parse(existingAttachments), ...attachments]; } catch {}
  }

  let parsedTags = [];
  if (tags) { try { parsedTags = JSON.parse(tags).filter(Boolean); } catch {} }

  let parsedLinks = [];
  if (links) { try { parsedLinks = JSON.parse(links); } catch {} }

  const created = await Announcement.create({
    title,
    content,
    type:          type || "general",
    status:        status || "published",
    expiryDate:    expiryDate || null,
    scheduledDate: scheduledDate || null,
    scheduledTime: scheduledTime || "",
    venue:         venue || "",
    image:         imageUrl,
    attachments:   combinedAttachments,
    job:           job || undefined,
    tags:          parsedTags,
    links:         parsedLinks,
    postedBy:      req.user._id,
  });

  const data = await populateAnnouncement(Announcement.findById(created._id)).lean();
  res.status(201).json({ status: "success", data });
});

// ── 5. Update Announcement (Admin) ───────────────────────────────────────
export const updateAnnouncement = catchAsync(async (req, res, next) => {
  const {
    title, content, type, status, expiryDate,
    scheduledDate, scheduledTime, venue,
    existingAttachments, removeImage, tags, links,
  } = req.body;

  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) return next(new AppError("Announcement not found.", 404));

  const { imageUrl, attachments: newAttachments } = processUploadedFiles(req);

  let finalAttachments = newAttachments;
  if (existingAttachments) {
    try { finalAttachments = [...JSON.parse(existingAttachments), ...newAttachments]; } catch {}
  }

  announcement.title         = title         ?? announcement.title;
  announcement.content       = content       ?? announcement.content;
  announcement.type          = type          ?? announcement.type;
  announcement.status        = status        ?? announcement.status;
  announcement.expiryDate    = expiryDate    !== undefined ? (expiryDate || null) : announcement.expiryDate;
  announcement.scheduledDate = scheduledDate !== undefined ? (scheduledDate || null) : announcement.scheduledDate;
  announcement.scheduledTime = scheduledTime ?? announcement.scheduledTime;
  announcement.venue         = venue         ?? announcement.venue;
  if (imageUrl)               announcement.image = imageUrl;
  if (removeImage === "true") announcement.image = undefined;
  if (existingAttachments !== undefined || newAttachments.length) {
    announcement.attachments = finalAttachments;
  }
  if (tags !== undefined) {
    try { announcement.tags = JSON.parse(tags).filter(Boolean); } catch {}
  }
  if (links !== undefined) {
    try { announcement.links = JSON.parse(links); } catch {}
  }

  await announcement.save();
  const data = await populateAnnouncement(Announcement.findById(announcement._id)).lean();
  res.status(200).json({ status: "success", data });
});

// ── 6. Delete Announcement (Admin) ───────────────────────────────────────
export const deleteAnnouncement = catchAsync(async (req, res, next) => {
  const announcement = await Announcement.findByIdAndDelete(req.params.id);
  if (!announcement) return next(new AppError("Announcement not found.", 404));
  res.status(204).json({ status: "success", data: null });
});
