import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import Admin from "./models/Admin.js";

dotenv.config();

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: "admin1@gmail.com" });
    
    if (existingAdmin) {
      console.log("⚠️ Admin already exists!");
      console.log("📧 Email:", existingAdmin.email);
      console.log("🆔 ID:", existingAdmin._id);
      process.exit();
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash("admin123", 10);

    // Create admin user
    const admin = await Admin.create({
      name: "Super Admin",
      email: "admin1@gmail.com",
      password: hashedPassword,
      role: "admin" // Add role if your schema has it
    });

    console.log("✅ Admin Created Successfully!");
    console.log("📧 Email:", admin.email);
    console.log("🔑 Password: admin123");
    console.log("🆔 Admin ID:", admin._id);
    
    process.exit();

  } catch (error) {
    console.error("❌ Error creating admin:", error);
    process.exit(1);
  }
};

createAdmin();



