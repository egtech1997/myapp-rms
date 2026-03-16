import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import Profile from "../models/Profile.js";
import Application from "../models/Application.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const publicDir  = path.join(__dirname, "..", "..", "public");

// ── GET /v1/profile/me ────────────────────────────────────────────────────────
export const getMyProfile = catchAsync(async (req, res) => {
  const profile = await Profile.findOne({ user: req.user._id });
  res.status(200).json({ status: "success", data: profile || null });
});

// Ensure a profile sub-array only contains plain objects, never strings.
// Strings can accumulate when a reactive proxy or array gets JSON.stringify'd
// and re-saved (e.g. Vue proxy serialisation edge cases or client reloads).
const sanitizeProfileArray = (arr) => {
  if (!Array.isArray(arr)) return arr;
  return arr.flatMap((item) => {
    if (item && typeof item === 'object') return [item];
    if (typeof item !== 'string') return [];
    const trimmed = item.trim();
    const target = trimmed.startsWith('[') ? trimmed : trimmed.startsWith('{') ? `[${trimmed}]` : null;
    if (!target) return [];
    try {
      const parsed = JSON.parse(target);
      return Array.isArray(parsed) ? parsed.filter(i => i && typeof i === 'object') : [];
    } catch {
      // JS-notation (single quotes, ObjectId, etc.) — extract {...} blocks
      const blocks = target.match(/\{[^{}]+\}/g) || [];
      return blocks.map(block => {
        const get = (f) => {
          const m = block.match(new RegExp(`${f}:\\s*['"]([^'"]+)['"]`)) ||
                    block.match(new RegExp(`${f}:\\s*([^,\\s}]+)`));
          return m ? m[1] : undefined;
        };
        return Object.fromEntries(
          ['type','name','rating','dateOfExam','placeOfExam','licenseNumber',
           'licenseValidity','document','licenseDocument','school','degree',
           'level','position','company','serviceType','title','hours','periodFrom','periodTo',
           'provider','typeOfLD','salaryGrade','statusOfAppointment']
            .map(f => [f, get(f)])
            .filter(([, v]) => v !== undefined)
        );
      }).filter(o => Object.keys(o).length > 0);
    }
  });
};

// ── PUT /v1/profile/me ────────────────────────────────────────────────────────
export const upsertMyProfile = catchAsync(async (req, res) => {
  // Sanitize arrays before saving — prevents stringified arrays from persisting in MongoDB
  const body = { ...req.body };
  ['education', 'eligibility', 'experience', 'training', 'voluntaryWork'].forEach(key => {
    if (body[key] !== undefined) body[key] = sanitizeProfileArray(body[key]);
  });

  const profile = await Profile.findOneAndUpdate(
    { user: req.user._id },
    { $set: { ...body, user: req.user._id } },
    { returnDocument: 'after', upsert: true, runValidators: false },
  );

  res.status(200).json({ status: "success", data: profile });
});

// ── POST /v1/profile/upload-doc ───────────────────────────────────────────────
// Multer (docStorage) saves the file into:
//   public/uploads/documents/{email}/{section}/{timestamp-random.ext}
// We derive the public URL from req.file.destination + req.file.filename.
export const uploadProfileDocument = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError("Please upload a file.", 400));
  }

  // Build the URL path relative to the public directory
  // req.file.destination is an absolute path like:
  //   .../public/uploads/documents/juan@deped.gov.ph/education
  const relativePath = req.file.destination
    .replace(publicDir, "")        // strip the absolute publicDir prefix
    .replace(/\\/g, "/");          // normalise Windows backslashes

  const fileUrl = `${relativePath}/${req.file.filename}`;

  // ── Delete the old file if the client sent its URL ────────────────────────
  const oldUrl = (req.body.oldUrl || "").trim();
  if (oldUrl && oldUrl !== fileUrl) {
    const cleanOld = oldUrl.startsWith("/api/") ? oldUrl.slice(4) : oldUrl;
    const oldAbsPath = path.join(publicDir, cleanOld);

    if (
      fs.existsSync(oldAbsPath) &&
      oldAbsPath.startsWith(path.join(publicDir, "uploads", "documents")) // safety fence
    ) {
      // Skip deletion if this file is referenced in any application snapshot —
      // preserving historical records for previously submitted applications.
      const docFields = [
        "applicantData.education.tor",
        "applicantData.education.diploma",
        "applicantData.eligibility.document",
        "applicantData.eligibility.licenseDocument",
        "applicantData.experience.document",
        "applicantData.training.document",
        "applicantData.comelecAddress.document",
        "submissionDocs.pds.fileUrl",
        "submissionDocs.applicationLetter.fileUrl",
        "submissionDocs.performanceRatingDoc.fileUrl",
        "submissionDocs.latestAppointment.fileUrl",
        "submissionDocs.workExperienceSheet.fileUrl",
        "submissionDocs.outstandingAccomplishments.fileUrl",
        "submissionDocs.movs.fileUrl",
        "submissionDocs.research.fileUrl",
        "submissionDocs.awards.fileUrl",
      ];
      const inUse = await Application.exists({
        $or: docFields.map((f) => ({ [f]: cleanOld })),
      });

      if (!inUse) {
        try { fs.unlinkSync(oldAbsPath); } catch (e) {
          console.error("[upload] Could not delete old document:", e.message);
        }
      }
    }
  }

  res.status(200).json({ status: "success", fileUrl, uploadedAt: new Date().toISOString() });
});
