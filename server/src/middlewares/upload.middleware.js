import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, "..", "..", "public");

// ── Sanitize email for use as a filesystem folder name ────────────────────────
// Keeps letters, digits, dots, hyphens, underscores, and the @ symbol.
// Replaces anything else with underscore and lowercases the whole string.
const sanitizeEmail = (email = "unknown") =>
  email.toLowerCase().replace(/[^a-z0-9.@_-]/g, "_");

// ── Ensure base upload dirs exist at startup ──────────────────────────────────
const ensureDir = (dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); };

ensureDir(path.join(publicDir, "uploads", "avatars"));
ensureDir(path.join(publicDir, "uploads", "system"));
ensureDir(path.join(publicDir, "uploads", "documents"));

// ── Avatar storage ────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(publicDir, "uploads", "avatars")),
  filename: (req, file, cb) => {
    const userId = req.user?._id || "guest";
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    let ext = path.extname(file.originalname).toLowerCase();
    if (!ext) ext = file.mimetype === "image/gif" ? ".gif" : file.mimetype === "image/png" ? ".png" : ".jpg";
    cb(null, `avatar-${userId}-${unique}${ext}`);
  },
});

// ── Document storage — organised by email / section ──────────────────────────
// IMPORTANT: The client must append `type` (and optionally `field`) to FormData
// BEFORE appending the `file` field so multer can read req.body.type here.
const docStorage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const email   = sanitizeEmail(req.user?.email);
    const section = (req.body.type || "general").replace(/[^a-zA-Z0-9_-]/g, "_");
    const dir     = path.join(publicDir, "uploads", "documents", email, section);
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    let ext = path.extname(file.originalname).toLowerCase();
    if (!ext) ext = file.mimetype === "application/pdf" ? ".pdf" : file.mimetype === "image/png" ? ".png" : ".jpg";
    cb(null, `${unique}${ext}`);
  },
});

// ── Application document storage — organised by jobId / userId ───────────────
// IMPORTANT: The client must append `jobId` BEFORE the file field in FormData.
const applicationDocStorage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const jobId  = (req.body.jobId  || "unknown").replace(/[^a-zA-Z0-9_-]/g, "_");
    const userId = (req.user?._id?.toString() || "guest").replace(/[^a-zA-Z0-9_-]/g, "_");
    const dir    = path.join(publicDir, "uploads", "applications", jobId, userId);
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    let ext = path.extname(file.originalname).toLowerCase();
    if (!ext) ext = file.mimetype === "application/pdf" ? ".pdf" : file.mimetype === "image/png" ? ".png" : ".jpg";
    cb(null, `${unique}${ext}`);
  },
});

// ── System logo storage ───────────────────────────────────────────────────────
const systemStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(publicDir, "uploads", "system")),
  filename: (_req, file, cb) => {
    let ext = path.extname(file.originalname).toLowerCase();
    if (!ext) ext = file.mimetype === "image/png" ? ".png" : ".jpg";
    cb(null, `logo-${Date.now()}${ext}`);
  },
});

// ── Announcement storage — images + docs in uploads/announcements/ ────────────
const announcementStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(publicDir, "uploads", "announcements");
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const ext    = path.extname(file.originalname).toLowerCase() || ".bin";
    cb(null, `announcement-${unique}${ext}`);
  },
});

// ── File filters ──────────────────────────────────────────────────────────────
const imageFilter = (_req, file, cb) =>
  file.mimetype.startsWith("image/")
    ? cb(null, true)
    : cb(new Error("Only image files are allowed."), false);

const docFilter = (_req, file, cb) =>
  file.mimetype.startsWith("image/") || file.mimetype === "application/pdf"
    ? cb(null, true)
    : cb(new Error("Only images and PDF files are allowed."), false);

// Accepts images, PDF, Word (.doc/.docx), and Excel (.xls/.xlsx)
const announcementFileFilter = (_req, file, cb) => {
  const allowed = [
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];
  allowed.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error("Only images, PDF, Word, and Excel files are allowed."), false);
};

// ── Exports ───────────────────────────────────────────────────────────────────
export const uploadAvatar = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: imageFilter,
});

export const uploadDocument = multer({
  storage: docStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: docFilter,
});

export const uploadApplicationDoc = multer({
  storage: applicationDocStorage,
  limits:  { fileSize: 15 * 1024 * 1024 },
  fileFilter: docFilter,
});

export const uploadSystemLogo = multer({
  storage: systemStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter,
});

// Single image field ("image") + up to 8 attachment files ("attachments")
export const uploadAnnouncementFiles = multer({
  storage: announcementStorage,
  limits:  { fileSize: 20 * 1024 * 1024 },
  fileFilter: announcementFileFilter,
}).fields([
  { name: "image",       maxCount: 1 },
  { name: "attachments", maxCount: 8 },
]);
