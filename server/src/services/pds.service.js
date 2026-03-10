import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const PdfPrinter = require('pdfmake/js/Printer').default;

const fonts = {
  Roboto: {
    normal: "Helvetica",
    bold: "Helvetica-Bold",
    italics: "Helvetica-Oblique",
    bolditalics: "Helvetica-BoldOblique",
  },
  Courier: {
    normal: "Courier",
    bold: "Courier-Bold",
    italics: "Courier-Oblique",
    bolditalics: "Courier-BoldOblique",
  },
};

const printer = new PdfPrinter(fonts);

/**
 * 🔹 CS FORM 212 (Revised 2017) - PERSONAL DATA SHEET
 * Generates a 4-page PDF based on the official Civil Service Commission format.
 */
export const generatePDS = (app) => {
  const p = app.applicantData?.personalInfo || {};
  const edu = app.applicantData?.education || [];
  const eli = app.applicantData?.eligibility || [];
  const exp = app.applicantData?.experience || [];
  const trn = app.applicantData?.training || [];
  const family = app.applicantData?.family || {};

  const docDefinition = {
    pageSize: "LEGAL",
    pageMargins: [20, 20, 20, 20],
    content: [
      // ── PAGE 1 ─────────────────────────────────────────────────────────────
      { text: "CS Form No. 212", style: "formLabel", bold: true, fontSize: 8 },
      { text: "Revised 2017", style: "formLabel", bold: true, fontSize: 8, margin: [0, 0, 0, 10] },
      { text: "PERSONAL DATA SHEET", style: "header", alignment: "center", bold: true, fontSize: 24, margin: [0, 0, 0, 20] },

      // I. Personal Information
      {
        table: {
          widths: ["*"],
          body: [[{ text: "I. PERSONAL INFORMATION", style: "sectionHeader", fillColor: "#9ca3af", color: "white", bold: true }]]
        }
      },
      {
        table: {
          widths: [100, "*", 80, 100],
          body: [
            [{ text: "Surname", style: "label" }, { text: p.lastName?.toUpperCase() || "N/A", style: "data", colSpan: 3 }, {}, {}],
            [{ text: "First Name", style: "label" }, { text: p.firstName?.toUpperCase() || "N/A", style: "data", colSpan: 3 }, {}, {}],
            [{ text: "Middle Name", style: "label" }, { text: p.middleName?.toUpperCase() || "N/A", style: "data", colSpan: 2 }, {}, { text: "Extension", style: "label" }],
            [
              { text: "Date of Birth", style: "label" },
              { text: p.birthDate ? new Date(p.birthDate).toLocaleDateString() : "N/A", style: "data" },
              { text: "Sex", style: "label" },
              { text: p.sex?.toUpperCase() || "N/A", style: "data" }
            ],
            [
              { text: "Civil Status", style: "label" },
              { text: p.civilStatus?.toUpperCase() || "N/A", style: "data" },
              { text: "Citizenship", style: "label" },
              { text: "FILIPINO", style: "data" }
            ],
            [
              { text: "Ethnic Group", style: "label" },
              { text: p.ethnicGroup?.toUpperCase() || "N/A", style: "data" },
              { text: "Religion", style: "label" },
              { text: p.religion?.toUpperCase() || "N/A", style: "data" }
            ],
            [
              { text: "Disability (if any)", style: "label" },
              { text: p.disability?.toUpperCase() || "N/A", style: "data", colSpan: 3 },
              {}, {}
            ]
          ]
        },
        margin: [0, 0, 0, 10]
      },

      // II. Family Background
      {
        table: {
          widths: ["*"],
          body: [[{ text: "II. FAMILY BACKGROUND", style: "sectionHeader", fillColor: "#9ca3af", color: "white", bold: true }]]
        }
      },
      {
        table: {
          widths: [100, "*", 100, "*"],
          body: [
            [{ text: "Spouse's Surname", style: "label" }, { text: family.spouse?.lastName?.toUpperCase() || "N/A", style: "data" }, { text: "Occupation", style: "label" }, { text: family.spouse?.occupation || "N/A", style: "data" }],
            [{ text: "First Name", style: "label" }, { text: family.spouse?.firstName?.toUpperCase() || "N/A", style: "data" }, { text: "Employer", style: "label" }, { text: family.spouse?.employer || "N/A", style: "data" }],
            [{ text: "Father's Surname", style: "label" }, { text: family.father?.lastName?.toUpperCase() || "N/A", style: "data" }, { text: "First Name", style: "label" }, { text: family.father?.firstName?.toUpperCase() || "N/A", style: "data" }],
            [{ text: "Mother's Maiden", style: "label" }, { text: family.mother?.lastName?.toUpperCase() || "N/A", style: "data" }, { text: "First Name", style: "label" }, { text: family.mother?.firstName?.toUpperCase() || "N/A", style: "data" }]
          ]
        },
        margin: [0, 0, 0, 10]
      },

      // III. Educational Background
      {
        table: {
          widths: ["*"],
          body: [[{ text: "III. EDUCATIONAL BACKGROUND", style: "sectionHeader", fillColor: "#9ca3af", color: "white", bold: true }]]
        }
      },
      {
        table: {
          headerRows: 1,
          widths: ["auto", "*", "*", "auto", "auto", "auto", "auto", "auto"],
          body: [
            [
              { text: "LEVEL", style: "tableHeader" },
              { text: "NAME OF SCHOOL", style: "tableHeader" },
              { text: "DEGREE / COURSE", style: "tableHeader" },
              { text: "FROM", style: "tableHeader" },
              { text: "TO", style: "tableHeader" },
              { text: "UNITS", style: "tableHeader" },
              { text: "GRADUATED", style: "tableHeader" },
              { text: "HONORS", style: "tableHeader" }
            ],
            ...edu.map(e => [
              { text: e.level, style: "smData" },
              { text: e.school, style: "smData" },
              { text: e.degree || "N/A", style: "smData" },
              { text: e.periodFrom || "-", style: "smData" },
              { text: e.periodTo || "-", style: "smData" },
              { text: e.unitsEarned || "-", style: "smData" },
              { text: e.yearGraduated || "-", style: "smData" },
              { text: e.honorsReceived || "-", style: "smData" }
            ])
          ]
        },
        margin: [0, 0, 0, 20]
      },

      { text: "", pageBreak: "after" }, 

      // ── PAGE 2 ─────────────────────────────────────────────────────────────
      // IV. Civil Service Eligibility
      {
        table: {
          widths: ["*"],
          body: [[{ text: "IV. CIVIL SERVICE ELIGIBILITY", style: "sectionHeader", fillColor: "#9ca3af", color: "white", bold: true }]]
        }
      },
      {
        table: {
          headerRows: 1,
          widths: ["*", "auto", "auto", "*", "auto", "auto"],
          body: [
            [
              { text: "CAREER SERVICE / RA 1080 (BOARD/BAR)", style: "tableHeader" },
              { text: "RATING", style: "tableHeader" },
              { text: "DATE OF EXAM", style: "tableHeader" },
              { text: "PLACE OF EXAMINATION", style: "tableHeader" },
              { text: "LICENSE NO.", style: "tableHeader" },
              { text: "VALIDITY", style: "tableHeader" }
            ],
            ...eli.map(e => [
              { text: e.name, style: "smData" },
              { text: e.rating || "N/A", style: "smData" },
              { text: e.dateOfExam ? new Date(e.dateOfExam).toLocaleDateString() : "-", style: "smData" },
              { text: e.placeOfExam || "-", style: "smData" },
              { text: e.licenseNumber || "-", style: "smData" },
              { text: e.licenseValidity ? new Date(e.licenseValidity).toLocaleDateString() : "-", style: "smData" }
            ])
          ]
        },
        margin: [0, 0, 0, 10]
      },

      // V. Work Experience
      {
        table: {
          widths: ["*"],
          body: [[{ text: "V. WORK EXPERIENCE", style: "sectionHeader", fillColor: "#9ca3af", color: "white", bold: true }]]
        }
      },
      {
        table: {
          headerRows: 1,
          widths: ["auto", "auto", "*", "*", "auto", "auto", "auto", "auto"],
          body: [
            [
              { text: "FROM", style: "tableHeader" },
              { text: "TO", style: "tableHeader" },
              { text: "POSITION TITLE", style: "tableHeader" },
              { text: "AGENCY / COMPANY", style: "tableHeader" },
              { text: "SALARY", style: "tableHeader" },
              { text: "SG", style: "tableHeader" },
              { text: "STATUS", style: "tableHeader" },
              { text: "GOV'T", style: "tableHeader" }
            ],
            ...exp.map(e => [
              { text: e.periodFrom ? new Date(e.periodFrom).toLocaleDateString() : "-", style: "smData" },
              { text: e.periodTo ? new Date(e.periodTo).toLocaleDateString() : "Present", style: "smData" },
              { text: e.position, style: "smData" },
              { text: e.company, style: "smData" },
              { text: e.monthlySalary ? `P${e.monthlySalary}` : "-", style: "smData" },
              { text: e.salaryGrade || "-", style: "smData" },
              { text: e.statusOfAppointment || "-", style: "smData" },
              { text: e.isGovernment ? "Y" : "N", style: "smData" }
            ])
          ]
        },
        margin: [0, 0, 0, 20]
      },

      { text: "", pageBreak: "after" },

      // ── PAGE 3 ─────────────────────────────────────────────────────────────
      // VII. Learning and Development (Training)
      {
        table: {
          widths: ["*"],
          body: [[{ text: "VII. LEARNING AND DEVELOPMENT (L&D) INTERVENTIONS", style: "sectionHeader", fillColor: "#9ca3af", color: "white", bold: true }]]
        }
      },
      {
        table: {
          headerRows: 1,
          widths: ["*", "auto", "auto", "auto", "auto", "*"],
          body: [
            [
              { text: "TITLE OF LEARNING AND DEVELOPMENT", style: "tableHeader" },
              { text: "FROM", style: "tableHeader" },
              { text: "TO", style: "tableHeader" },
              { text: "HOURS", style: "tableHeader" },
              { text: "TYPE", style: "tableHeader" },
              { text: "CONDUCTED BY", style: "tableHeader" }
            ],
            ...trn.map(t => [
              { text: t.title, style: "smData" },
              { text: t.periodFrom ? new Date(t.periodFrom).toLocaleDateString() : "-", style: "smData" },
              { text: t.periodTo ? new Date(t.periodTo).toLocaleDateString() : "-", style: "smData" },
              { text: t.hours, style: "smData" },
              { text: t.typeOfLD || "-", style: "smData" },
              { text: t.provider || "-", style: "smData" }
            ])
          ]
        },
        margin: [0, 0, 0, 20]
      },

      { text: "", pageBreak: "after" },

      // ── PAGE 4 ─────────────────────────────────────────────────────────────
      // Signature Page
      {
        table: {
          widths: ["*"],
          body: [[{ text: "REFERENCES (Person not related by consanguinity or affinity to applicant)", style: "sectionHeader", fillColor: "#9ca3af", color: "white", bold: true }]]
        }
      },
      { text: "(References data not currently tracked)", style: "placeholder", margin: [0, 5, 0, 20] },

      {
        text: "I declare under oath that I have personally accomplished this Personal Data Sheet which is a true, correct and complete statement pursuant to the provisions of pertinent laws, rules and regulations of the Republic of the Philippines. I authorize the agency head/authorized representative to verify/validate the contents stated herein.",
        style: "declaration",
        alignment: "justify",
        margin: [0, 20, 0, 20]
      },

      {
        columns: [
          {
            width: "*",
            stack: [
              { text: "Government Issued ID:", style: "label", bold: true },
              { text: "ID/License No.: ________________", style: "label" },
              { text: "Date/Place of Issuance: ________", style: "label" }
            ]
          },
          {
            width: "*",
            stack: [
              { text: "\n\n______________________________", alignment: "center" },
              { text: "Signature (Sign inside the box)", alignment: "center", fontSize: 8 },
              { text: `\nDate: ${new Date().toLocaleDateString()}`, alignment: "center", fontSize: 8 }
            ]
          }
        ]
      }
    ],
    styles: {
      header: { fontSize: 18, bold: true },
      sectionHeader: { fontSize: 10, bold: true, margin: [2, 2, 2, 2] },
      label: { fontSize: 8, color: "#4b5563" },
      data: { fontSize: 9, bold: true, color: "#1f2937" },
      tableHeader: { fontSize: 7, bold: true, alignment: "center", fillColor: "#e5e7eb" },
      smData: { fontSize: 7 },
      declaration: { fontSize: 9, italics: true },
      placeholder: { fontSize: 8, italics: true, color: "#9ca3af", alignment: "center" }
    }
  };

  return printer.createPdfKitDocument(docDefinition);
};
