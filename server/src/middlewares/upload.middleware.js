import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = "public/uploads/avatars";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
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

export const uploadAvatar = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: fileFilter,
});
