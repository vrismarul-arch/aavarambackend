import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";

/* ADMIN LOGIN - Database Version */
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔐 Admin login attempt for email:', email);
    
    // Check if admin exists in database
    const admin = await Admin.findOne({ email });
    
    if (!admin) {
      console.log('❌ Admin not found');
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    // Compare password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    
    if (!isPasswordValid) {
      console.log('❌ Invalid password');
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    console.log('✅ Admin authenticated successfully');
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: admin._id,
        role: admin.role || "admin", 
        email: admin.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    
    // Send response
    res.json({ 
      token,
      message: "Login successful",
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email
      }
    });
    
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ message: "Server Error" });
  }
};