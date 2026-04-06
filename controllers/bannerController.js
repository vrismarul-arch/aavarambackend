// controllers/bannerController.js
import Banner from "../models/Banner.js";
import supabase from "../config/supabase.js";

// Helper function to upload to Supabase
const uploadToSupabase = async (file, folder) => {
  if (!file) return null;

  const fileExtension = file.originalname.split(".").pop();
  const fileName = `${folder}/${Date.now()}-${Math.random()
    .toString(36)
    .substring(7)}.${fileExtension}`;

  const { error, data } = await supabase.storage
    .from("products")
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from("products")
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
};

/* ADD Banner with both images */
export const addBanner = async (req, res) => {
  try {
    if (!req.files?.desktopImage?.[0]) {
      return res.status(400).json({
        success: false,
        message: "Desktop image is required",
      });
    }

    if (!req.files?.mobileImage?.[0]) {
      return res.status(400).json({
        success: false,
        message: "Mobile image is required",
      });
    }

    const [desktopUrl, mobileUrl] = await Promise.all([
      uploadToSupabase(req.files.desktopImage[0], "banners/desktop"),
      uploadToSupabase(req.files.mobileImage[0], "banners/mobile"),
    ]);

    const banner = await Banner.create({
      desktopImage: desktopUrl,
      mobileImage: mobileUrl,
      title: req.body.title || "",
      subtitle: req.body.subtitle || "",
      link: req.body.link || "",
      order: parseInt(req.body.order) || 0,
      isActive: req.body.isActive === "true" || req.body.isActive === true,
    });

    res.status(201).json({
      success: true,
      data: banner,
      message: "Banner created successfully",
    });
  } catch (error) {
    console.error("Add Banner Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

/* GET all banners */
export const getBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ order: 1, createdAt: -1 });
    res.json({
      success: true,
      data: banners,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ✅ GET ACTIVE BANNERS (Add this endpoint) */
export const getActiveBanners = async (req, res) => {
  try {
    const banners = await Banner.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .select("desktopImage mobileImage title subtitle link order isActive");

    res.json({
      success: true,
      data: banners,
      count: banners.length,
    });
  } catch (error) {
    console.error("Get Active Banners Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* GET single banner */
export const getBannerById = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }
    res.json({
      success: true,
      data: banner,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* UPDATE Banner */
export const updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    let desktopUrl = banner.desktopImage;
    let mobileUrl = banner.mobileImage;

    if (req.files?.desktopImage?.[0]) {
      desktopUrl = await uploadToSupabase(req.files.desktopImage[0], "banners/desktop");
    }

    if (req.files?.mobileImage?.[0]) {
      mobileUrl = await uploadToSupabase(req.files.mobileImage[0], "banners/mobile");
    }

    const updatedBanner = await Banner.findByIdAndUpdate(
      req.params.id,
      {
        desktopImage: desktopUrl,
        mobileImage: mobileUrl,
        title: req.body.title !== undefined ? req.body.title : banner.title,
        subtitle: req.body.subtitle !== undefined ? req.body.subtitle : banner.subtitle,
        link: req.body.link !== undefined ? req.body.link : banner.link,
        order: req.body.order !== undefined ? parseInt(req.body.order) : banner.order,
        isActive: req.body.isActive !== undefined
          ? (req.body.isActive === "true" || req.body.isActive === true)
          : banner.isActive,
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedBanner,
      message: "Banner updated successfully",
    });
  } catch (error) {
    console.error("Update Banner Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

/* DELETE Banner */
export const deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    await Banner.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Banner deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};