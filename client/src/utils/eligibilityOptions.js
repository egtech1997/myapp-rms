/**
 * Standard Philippine CSC Eligibility options.
 * Used in: admin job form QS, admin job template form, user profile eligibility.
 */
export const ELIGIBILITY_OPTIONS = [
  // ── 2nd Level (Professional) ──────────────────────────────────────────────
  { value: "RA 1080 (Registered Teacher / LET)",         label: "RA 1080 — Registered Teacher (LET)",              level: 2 },
  { value: "NQESH (National Qualifying Exam for School Heads)", label: "NQESH — National Qualifying Exam for School Heads", level: 2 },
  { value: "RA 1080 (Other Professional — Board Exam)",  label: "RA 1080 — Other Professional (Board Exam)",        level: 2 },
  { value: "Career Service (Professional)",              label: "Career Service Professional — 2nd Level (CSE-PPT)", level: 2 },
  { value: "Bar (RA 1080)",                              label: "RA 1080 — Bar Exam (Attorney)",                    level: 2 },
  { value: "2nd Level Eligibility (Other)",              label: "2nd Level Eligibility (Other)",                    level: 2 },

  // ── 1st Level (Sub-Professional) ─────────────────────────────────────────
  { value: "Career Service (Sub-Professional)",          label: "Career Service Sub-Professional — 1st Level (CSE-PPT)", level: 1 },
  { value: "1st Level Eligibility (Other)",              label: "1st Level Eligibility (Other)",                    level: 1 },

  // ── Special / Misc ────────────────────────────────────────────────────────
  { value: "MC 11 s. 1996 (Barangay Official)",          label: "MC 11 s. 1996 — Barangay Official",                level: 1 },
  { value: "R.A. 7883 (Barangay Health Worker)",         label: "R.A. 7883 — Barangay Health Worker",               level: 1 },
  { value: "None Required",                              label: "None Required",                                    level: 0 },
];

/** Eligibility options grouped by level for use in <optgroup> */
export const ELIGIBILITY_GROUPS = [
  {
    label: "2nd Level — Professional",
    options: ELIGIBILITY_OPTIONS.filter(o => o.level === 2),
  },
  {
    label: "1st Level — Sub-Professional",
    options: ELIGIBILITY_OPTIONS.filter(o => o.level === 1),
  },
  {
    label: "Special",
    options: ELIGIBILITY_OPTIONS.filter(o => o.level === 0),
  },
];
