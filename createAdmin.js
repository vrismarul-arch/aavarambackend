import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import Admin from "./models/Admin.js";

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
.then(async () => {

  const hashed = await bcrypt.hash("admin123", 10);

  await Admin.create({
    name: "Super Admin",
    email: "admin2@gmail.com",
    password: hashed
  });

  console.log("✅ Admin Created Successfully");
  process.exit();

})
.catch(err => console.log(err));
