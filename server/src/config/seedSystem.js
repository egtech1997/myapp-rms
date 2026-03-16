import Role from "../models/Role.js";
import User from "../models/User.js";

// All explicit permissions — kept for seeding the default admin role
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

export const seedSystem = async () => {
  // ── super_admin: uses "all" wildcard — bypasses every permission check
  //    automatically covers any new permission added during development
  const superAdminRole = await Role.findOneAndUpdate(
    { name: "super_admin" },
    {
      $set:        { permissions: ["all"] },
      $setOnInsert: { description: "Full system access with immutable privileges." },
    },
    { upsert: true, returnDocument: "after" }
  );
  console.log("✅ super_admin role synced (wildcard: all)");

  // ── admin / user: create only if missing, never overwrite customizations ──
  await Role.findOneAndUpdate(
    { name: "admin" },
    {
      $setOnInsert: {
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
    },
    { upsert: true }
  );

  await Role.findOneAndUpdate(
    { name: "user" },
    {
      $setOnInsert: {
        name: "user",
        permissions: [],
        description: "Standard applicant access.",
      },
    },
    { upsert: true }
  );
  console.log("✅ admin / user roles verified");

  // ── super_admin account: create only if absent ────────────────────
  const existing = await User.findOne({ email: "superadmin@deped.gov.ph" });
  if (!existing) {
    await User.create({
      username: "super_admin",
      email: "superadmin@deped.gov.ph",
      password: "password",          // pre-save hook hashes this automatically
      roles: [superAdminRole._id],
      isVerified: true,
    });
    console.log("✅ Super-admin account created (superadmin@deped.gov.ph / password)");
  } else {
    console.log("✅ Super-admin account already exists — skipped");
  }
};
