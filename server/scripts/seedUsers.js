import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

dotenv.config();

const seedUsers = [
  {
    name: "System Admin",
    email: "admin@exam.com",
    password: "admin123",
    role: "admin"
  },
  {
    name: "John Teacher",
    email: "teacher@exam.com",
    password: "teacher123",
    role: "teacher"
  },
  {
    name: "Alice Student",
    email: "student@exam.com",
    password: "student123",
    role: "student"
  },
  {
    name: "Bob Student",
    email: "bob@exam.com",
    password: "student123",
    role: "student"
  }
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    for (const userData of seedUsers) {
      const existing = await User.findOne({ email: userData.email });

      if (existing) {
        console.log(`User ${userData.email} already exists, skipping`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10);

      await User.create({
        ...userData,
        password: hashedPassword
      });

      console.log(`Created ${userData.role}: ${userData.email}`);
    }

    console.log("\nSeed completed! Demo accounts:");
    console.log("  Admin:   admin@exam.com / admin123");
    console.log("  Teacher: teacher@exam.com / teacher123");
    console.log("  Student: student@exam.com / student123");
    console.log("  Student: bob@exam.com / student123");

    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error.message);
    process.exit(1);
  }
};

seed();
