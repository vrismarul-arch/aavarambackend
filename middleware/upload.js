// config/upload.js
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for memory storage (for Supabase/cloud upload)
const memoryStorage = multer.memoryStorage();

// File filter for images
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
    cb(
      new Error(
        `Invalid file type. Only ${allowedMimes
          .map((m) => m.replace("image/", ""))
          .join(", ")} are allowed`
      )
    );
  }
};

// File size limit (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES_TOTAL = 11; // 1 main + 10 sub

// Banner-specific upload configuration (desktop + mobile)
export const bannerUpload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 2, // desktop + mobile
  },
  fileFilter: imageFilter,
}).fields([
  { name: "desktopImage", maxCount: 1 },
  { name: "mobileImage", maxCount: 1 },
]);

// Product-specific upload configuration
export const productUpload = multer({
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

// Single file upload (for backward compatibility)
export const upload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: imageFilter,
});

// Single file upload with field name
export const uploadSingle = (fieldName) => {
  return multer({
    storage: memoryStorage,
    limits: {
      fileSize: MAX_FILE_SIZE,
    },
    fileFilter: imageFilter,
  }).single(fieldName);
};

// Multiple files upload
export const uploadMultiple = (fields) => {
  return multer({
    storage: memoryStorage,
    limits: {
      fileSize: MAX_FILE_SIZE,
      files: MAX_FILES_TOTAL,
    },
    fileFilter: imageFilter,
  }).fields(fields);
};

// Error handler middleware for multer
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer-specific errors
    switch (err.code) {
      case "FILE_TOO_LARGE":
        return res.status(400).json({
          success: false,
          message: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        });
      case "TOO_MANY_FILES":
        return res.status(400).json({
          success: false,
          message: `Too many files. Maximum ${MAX_FILES_TOTAL} files allowed`,
        });
      case "LIMIT_FILE_COUNT":
        return res.status(400).json({
          success: false,
          message: `Too many files. Maximum ${MAX_FILES_TOTAL} files allowed`,
        });
      case "LIMIT_UNEXPECTED_FILE":
        return res.status(400).json({
          success: false,
          message: `Unexpected field: ${err.field}. Allowed fields: desktopImage, mobileImage`,
        });
      default:
        return res.status(400).json({
          success: false,
          message: err.message,
        });
    }
  }

  // Custom validation errors
  if (err.message && err.message.includes("Invalid file type")) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // Pass through if not multer error
  next(err);
};

// Helper function to validate required files
export const validateFiles = (requiredFields = []) => {
  return (req, res, next) => {
    const missingFields = [];

    requiredFields.forEach((field) => {
      if (!req.files?.[field] || req.files[field].length === 0) {
        missingFields.push(field);
      }
    });

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required files: ${missingFields.join(", ")}`,
      });
    }

    next();
  };
};

// Optional: Local disk storage (for development without cloud storage)
export const localUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      let folder = "uploads/";
      if (file.fieldname === "desktopImage") {
        folder += "desktop";
      } else if (file.fieldname === "mobileImage") {
        folder += "mobile";
      } else {
        folder += "others";
      }
      cb(null, folder);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
  }),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: imageFilter,
});

export default {
  bannerUpload,
  productUpload,
  upload,
  uploadSingle,
  uploadMultiple,
  handleUploadError,
  validateFiles,
  localUpload,
};