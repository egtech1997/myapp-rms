# DepEd HR Recruitment Portal (Guih-Ranking) - System State

## 🏗️ Architecture Overview
- **Project Name:** Guih-Ranking
- **Purpose:** Official Recruitment Portal for Human Resources in the Department of Education (DepEd).
- **Tech Stack:** MERN (MongoDB, Express, Vue 3, Node.js)
- **Frontend:** Vite + Vue 3 (Composition API), Tailwind CSS v4, PrimeVue Icons
- **Backend:** Node.js + Express, Mongoose, Passport.js (JWT/Cookie)
- **Design System:** DepEd Design System v2 (Institutional Blue/Gold, Glassmorphism)

## 📦 Implemented Modules & Features

### 1. Applicant Journey
- **Guest Browsing:** Public job bulletin with search and filter capabilities.
- **Profile (PDS) Hub:** Full 7-tab Personal Data Sheet (CS Form 212) including Ethnic Group and Religion. Features a "Readiness Checklist" and real-time completeness progress.
- **Application Portal:** Snapshot strategy capturing PDS data at time of submission. Includes a Document Upload portal for PDF/Image proofs.
- **Candidate Dashboard:** Interactive "Application Journey" tracker showing progress from Applied to Ranked. Score transparency for assessed candidates.

### 2. Admin (PBAC/HR) Hub
- **Advanced Search:** Deep-indexing of nested PDS fields for sub-second keyword discovery across thousands of records.
- **Verification Portal:** Side-by-side audit UI comparing candidate data vs. uploaded proofs. Includes Qualification Standards (QS) matching and physical document checklists.
- **Dynamic Evaluation (Digital IES):** Automated scoring engine that swaps rubrics based on Job Track (Teaching vs. Non-Teaching) per DO 007, s. 2023. Statuses: `Evaluating` -> `Evaluated`.
- **Ranking Engine (CAL/RQA):** Automatic calculation of points and tie-breaking logic based on residency, GPA, and experience.

### 3. Reporting & Automation
- **Formal Letter System:** Branded email notifications using official DepEd letterhead for Qualification and Disqualification notices.
- **Auto-Announcement:** Generates and posts the "Initial Evaluation Result (IER)" to the public bulletin.
- **PDF Generators:** High-precision government form generation for:
  - CS Form 212 (4-page PDS)
  - CAR-RQA (Ranked Registry)
  - CS Form 33-A (Appointment Form - *Inactive*)

### 4. Security & Integrity
- **Audit Log System:** Immutable ledger tracking every change to scores, status, and document verification with visual diffs.
- **RBAC:** Strict Role-Based Access Control for Guest, Applicant, HR, and Admin roles.

## 🔄 Current Data Flow
1. **Guest:** Views jobs on Home Bulletin.
2. **User:** Logins -> Completes PDS -> Uploads Documents -> Applies.
3. **Admin:** Verifies Docs -> Matches QS -> Posts IER Announcement -> Formal Letter Sent.
4. **Panelist:** Evaluates Candidate (Digital IES) -> Marks as `Evaluated`.
5. **System:** Aggregates Scores -> Generates RQA -> Release Ranking.

## 📌 Development Notes for Future Sessions
- Focus is currently locked on the **Application-to-Ranking** lifecycle.
- Appointment features (CS Form 33-A) are implemented but sidelined to prioritize recruitment transparency.
- Ethnic Group and Religion fields were the most recent additions to the PDS data pipeline.
