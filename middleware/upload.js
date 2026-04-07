// middleware/upload.js
import multer from "multer";

const memoryStorage = multer.memoryStorage();

const imageFilter = (req, file, cb) => {
  const allowedMimes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Only jpeg, jpg, png, gif, webp, svg are allowed`));
  }
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// ✅ FIXED: uploadMultiple is now direct middleware, not a factory function
export const uploadMultiple = multer({
  storage: memoryStorage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 11, // 1 main + 10 sub
  },
  fileFilter: imageFilter,
}).fields([
  { name: "mainImage", maxCount: 1 },
  { name: "subImages", maxCount: 10 },
]);

// Banner upload
export const bannerUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: MAX_FILE_SIZE, files: 2 },
  fileFilter: imageFilter,
}).fields([
  { name: "desktopImage", maxCount: 1 },
  { name: "mobileImage", maxCount: 1 },
]);

// Single file upload
export const upload = multer({
  storage: memoryStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: imageFilter,
});

export const uploadSingle = (fieldName) =>
  multer({
    storage: memoryStorage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: imageFilter,
  }).single(fieldName);

// Validate required file fields middleware
export const validateFiles = (requiredFields = []) => {
  return (req, res, next) => {
    const missingFields = requiredFields.filter(
      (field) => !req.files?.[field] || req.files[field].length === 0
    );
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required files: ${missingFields.join(", ")}`,
      });
    }
    next();
  };
};

// Multer error handler
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        return res.status(400).json({ success: false, message: "File too large. Max 5MB allowed." });
      case "LIMIT_FILE_COUNT":
        return res.status(400).json({ success: false, message: "Too many files. Max 11 allowed." });
      case "LIMIT_UNEXPECTED_FILE":
        return res.status(400).json({ success: false, message: `Unexpected field: ${err.field}` });
      default:
        return res.status(400).json({ success: false, message: err.message });
    }
  }
  if (err?.message?.includes("Invalid file type")) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next(err);
};

export default { uploadMultiple, bannerUpload, upload, uploadSingle, handleUploadError, validateFiles };