// adminRoutes.js or wherever loginAdmin is defined
import jwt from "jsonwebtoken";

/* ADMIN LOGIN */
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Debug logging (remove in production)
    console.log('🔐 Admin login attempt for email:', email);
    console.log('📧 Expected email:', process.env.ADMIN_EMAIL);
    
    // Check if credentials exist in environment
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      console.error('❌ Admin credentials not configured in .env file');
      return res.status(500).json({ 
        message: "Server configuration error. Please check environment variables." 
      });
    }
    
    // Validate credentials
    if (email !== process.env.ADMIN_EMAIL) {
      console.log('❌ Email mismatch');
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    if (password !== process.env.ADMIN_PASSWORD) {
      console.log('❌ Password mismatch');
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    console.log('✅ Admin authenticated successfully');
    
    // Generate JWT token
    const token = jwt.sign(
      { role: "admin", email: process.env.ADMIN_EMAIL },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    
    // Send response
    res.json({ 
      token,
      message: "Login successful" 
    });
    
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ message: "Server Error" });
  }
};