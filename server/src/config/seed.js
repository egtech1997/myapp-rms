import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Role from "../models/Role.js";

// Manually resolve the path to the .env file in the server root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });

const seedRoles = async () => {
  const uri = process.env.MONGO_URI; // 👈 MATCHED TO YOUR .ENV

  if (!uri) {
    console.error("❌ Error: MONGO_URI is missing from your .env file!");
    process.exit(1);
  }

  try {
    console.log("🌱 Attempting to connect to MongoDB...");
    await mongoose.connect(uri);
    console.log("✅ Connected to MongoDB");

    // 1. Clear existing roles
    await Role.deleteMany();

    // 2. Insert fresh roles
    await Role.insertMany([
      { name: "user", permissions: ["read:profile"] },
      {
        name: "admin",
        permissions: ["read:profile", "delete:users", "manage:roles"],
      },
    ]);

    console.log("🚀 Roles Seeded Successfully!");
    process.exit(0);
  } catch (err) {
    console.error("💥 Seeding failed:", err.message);
    process.exit(1);
  }
};

seedRoles();
