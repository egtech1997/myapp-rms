import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = "public/uploads/avatars";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const systemUploadDir = "public/uploads/system";
if (!fs.existsSync(systemUploadDir)) {
  fs.mkdirSync(systemUploadDir, { recursive: true });
}

const docUploadDir = "public/uploads/documents";
if (!fs.existsSync(docUploadDir)) {
  fs.mkdirSync(docUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const userId = req.user?._id || "guest";
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);

    let ext = path.extname(file.originalname).toLowerCase();

    if (!ext) {
      if (file.mimetype === "image/gif") ext = ".gif";
      else if (file.mimetype === "image/png") ext = ".png";
      else ext = ".jpg";
    }

    cb(null, `avatar-${userId}-${uniqueSuffix}${ext}`);
  },
});

const docStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, docUploadDir),
  filename: (req, file, cb) => {
    const userId = req.user?._id || "user";
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    let ext = path.extname(file.originalname).toLowerCase();
    if (!ext) {
      if (file.mimetype === "application/pdf") ext = ".pdf";
      else if (file.mimetype === "image/png") ext = ".png";
      else ext = ".jpg";
    }
    cb(null, `doc-${userId}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type. Only images (including GIFs) are allowed!"),
      false,
    );
  }
};

const docFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/") || file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only images and PDFs are allowed!"), false);
  }
};

export const uploadAvatar = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: fileFilter,
});

export const uploadDocument = multer({
  storage: docStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: docFilter,
});

const systemStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, systemUploadDir),
  filename: (req, file, cb) => {
    let ext = path.extname(file.originalname).toLowerCase();
    if (!ext) ext = file.mimetype === "image/png" ? ".png" : ".jpg";
    cb(null, `logo-${Date.now()}${ext}`);
  },
});

export const uploadSystemLogo = multer({
  storage: systemStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter,
});
