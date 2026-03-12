import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import Role from "../models/Role.js";
import User from "../models/User.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });

const seedSystem = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Database Connected");

    await Role.deleteMany();
    await User.deleteMany();

    const allPermissions = [
      "dash_view",
      "vac_view",
      "vac_create",
      "vac_edit",
      "vac_delete",
      "app_view",
      "app_view_sensitive",
      "app_verify",
      "app_disqualify",
      "eval_view",
      "eval_score",
      "eval_view_others",
      "eval_finalize",
      "rqa_view",
      "rqa_generate",
      "rqa_export",
      "rqa_publish",
      "appt_view",
      "appt_select",
      "appt_generate",
      "ann_manage",
      "set_manage",
      "rubric_manage",
      "audit_view",
      "role_view",
      "role_manage",
      "user_view",
      "user_manage",
    ];

    const roles = await Role.insertMany([
      {
        name: "super_admin",
        permissions: allPermissions,
        description: "Full system access with immutable privileges.",
      },
      {
        name: "admin",
        permissions: [
          "dash_view",
          "vac_view",
          "vac_create",
          "vac_edit",
          "app_view",
          "app_verify",
          "eval_view",
          "rqa_view",
          "ann_manage",
          "user_view",
          "role_view",
        ],
        description: "General administrative access for recruitment oversight.",
      },
      {
        name: "user",
        permissions: [],
        description: "Standard applicant access.",
      },
    ]);

    const superAdminRole = roles.find((r) => r.name === "super_admin");

    const commonPassword = await bcrypt.hash("password", 12);

    const initialUsers = [
      {
        username: "super_admin",
        email: "superadmin@deped.gov.ph",
        password: commonPassword,
        roles: [superAdminRole._id],
        isVerified: true,
      },
    ];

    await User.insertMany(initialUsers);

    console.log("-----------------------------------------------");
    console.log("🚀 SYSTEM SEEDED SUCCESSFULLY");
    console.log("-----------------------------------------------");
    console.log("👤 SUPER ADMIN: superadmin@deped.gov.ph");
    console.log("🔑 PASSWORD:    password");
    console.log("-----------------------------------------------");

    process.exit(0);
  } catch (err) {
    console.error("💥 Seed Error:", err);
    process.exit(1);
  }
};

seedSystem();
