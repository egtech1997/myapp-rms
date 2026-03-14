import bcrypt from "bcryptjs";
import Role from "../models/Role.js";
import User from "../models/User.js";

const ALL_PERMISSIONS = [
  "dash_view",
  "vac_view", "vac_create", "vac_edit", "vac_delete",
  "app_view", "app_view_sensitive", "app_verify", "app_disqualify",
  "eval_view", "eval_score", "eval_view_others", "eval_finalize",
  "rqa_view", "rqa_generate", "rqa_export", "rqa_publish",
  "appt_view", "appt_select", "appt_generate",
  "ann_manage", "set_manage", "rubric_manage", "audit_view",
  "role_view", "role_manage", "user_view", "user_manage",
];

const ROLE_SEEDS = [
  {
    name: "super_admin",
    permissions: ALL_PERMISSIONS,
    description: "Full system access with immutable privileges.",
  },
  {
    name: "admin",
    permissions: [
      "dash_view",
      "vac_view", "vac_create", "vac_edit",
      "app_view", "app_verify",
      "eval_view",
      "rqa_view",
      "ann_manage",
      "user_view", "role_view",
    ],
    description: "General administrative access for recruitment oversight.",
  },
  {
    name: "user",
    permissions: [],
    description: "Standard applicant access.",
  },
];

export const seedSystem = async () => {
  // ── Upsert roles (never delete existing) ─────────────────────
  for (const roleDef of ROLE_SEEDS) {
    await Role.findOneAndUpdate(
      { name: roleDef.name },
      { $setOnInsert: roleDef },
      { upsert: true, returnDocument: "after" }
    );
  }
  console.log("✅ Roles verified/seeded");

  // ── Upsert super_admin user (only if absent) ──────────────────
  const superAdminRole = await Role.findOne({ name: "super_admin" });
  if (!superAdminRole) return;

  const existing = await User.findOne({ email: "superadmin@deped.gov.ph" });
  if (!existing) {
    const hashed = await bcrypt.hash("password", 12);
    await User.create({
      username: "super_admin",
      email: "superadmin@deped.gov.ph",
      password: hashed,
      roles: [superAdminRole._id],
      isVerified: true,
    });
    console.log("✅ Super-admin account created  (superadmin@deped.gov.ph / password)");
  } else {
    console.log("✅ Super-admin account already exists — skipped");
  }
};
