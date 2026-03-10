import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const PdfPrinter = require('pdfmake/js/Printer').default;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fonts = {
  Roboto: {
    normal:      'Helvetica',
    bold:        'Helvetica-Bold',
    italics:     'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  }
};

const printer = new PdfPrinter(fonts);

/**
 * 🔹 IER (Initial Evaluation Result)
 * Used to announce who met the minimum QS.
 */
export const generateIERDoc = (data) => {
  const { job, applicants, dateEvaluated = new Date() } = data;
  const qualified = applicants.filter(a => a.isQualified);
  const disqualified = applicants.filter(a => !a.isQualified);

  const fullName = (a) => {
    const p = a.applicantData?.personalInfo;
    if (!p) return "Unknown";
    return `${p.lastName}, ${p.firstName} ${p.middleName || ""} ${p.suffix || ""}`.toUpperCase();
  };

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    content: [
      { text: 'Republic of the Philippines', alignment: 'center', fontSize: 9 },
      { text: 'Department of Education', alignment: 'center', fontSize: 12, bold: true, color: '#1d4ed8' },
      { text: 'Schools Division Office', alignment: 'center', fontSize: 9, margin: [0, 0, 0, 20] },
      
      { text: 'INITIAL EVALUATION RESULT (IER)', style: 'mainTitle', alignment: 'center', margin: [0, 0, 0, 20] },
      
      {
        table: {
          widths: ['20%', '80%'],
          body: [
            [{ text: 'Position:', bold: true }, job.positionTitle],
            [{ text: 'Item Number:', bold: true }, job.itemNumbers?.join(', ') || 'N/A'],
            [{ text: 'Level:', bold: true }, job.salaryGrade >= 18 ? 'Second Level' : 'First Level'],
          ]
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 20]
      },

      { text: 'I. QUALIFIED APPLICANTS (Meets QS)', style: 'sectionTitle' },
      {
        table: {
          headerRows: 1,
          widths: ['8%', '70%', '22%'],
          body: [
            [{ text: 'NO.', style: 'tableHeader' }, { text: 'NAME', style: 'tableHeader' }, { text: 'REMARKS', style: 'tableHeader' }],
            ...qualified.map((a, i) => [
              { text: i + 1, alignment: 'center' },
              fullName(a),
              { text: 'Qualified', alignment: 'center', fontSize: 8 }
            ])
          ]
        }
      },

      { text: '\nII. DISQUALIFIED APPLICANTS (Below QS)', style: 'sectionTitle' },
      {
        table: {
          headerRows: 1,
          widths: ['8%', '32%', '60%'],
          body: [
            [{ text: 'NO.', style: 'tableHeader' }, { text: 'NAME', style: 'tableHeader' }, { text: 'REASON(S)', style: 'tableHeader' }],
            ...disqualified.map((a, i) => [
              { text: i + 1, alignment: 'center' },
              fullName(a),
              { text: a.disqualificationReason || 'Incomplete Documents', fontSize: 8 }
            ])
          ]
        },
        margin: [0, 0, 0, 40]
      },

      // IER Signatories
      {
        columns: [
          {
            stack: [
              { text: 'Prepared by:\n\n', fontSize: 10 },
              { text: '__________________________', bold: true },
              { text: 'HR Secretariat / PBAC Secretary', fontSize: 9 }
            ]
          },
          {
            stack: [
              { text: 'Certified Correct:\n\n', fontSize: 10 },
              { text: '__________________________', bold: true },
              { text: 'HRMPSB Chairperson', fontSize: 9 }
            ]
          }
        ]
      }
    ],
    styles: {
      mainTitle: { fontSize: 14, bold: true },
      sectionTitle: { fontSize: 10, bold: true, margin: [0, 10, 0, 5] },
      tableHeader: { fontSize: 8, bold: true, fillColor: '#f8fafc', alignment: 'center' }
    },
    defaultStyle: { font: 'Roboto', fontSize: 10 }
  };

  return printer.createPdfKitDocument(docDefinition);
};

/**
 * 🔹 IES (Individual Evaluation Sheet) - REFINED
 * Behavioral Event Interview Scorecard.
 */
export const generateIESDoc = (data) => {
  const { application, interview, job, panelistName = "________________" } = data;
  const p = application.applicantData?.personalInfo;
  const candidateName = `${p?.lastName}, ${p?.firstName} ${p?.middleName || ""} ${p?.suffix || ""}`.toUpperCase();

  const totalScore = interview.criteria.reduce((s, c) => s + (Number(c.score) || 0), 0);
  const maxPossible = interview.criteria.reduce((s, c) => s + (Number(c.maxScore) || 0), 0);

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 40],
    content: [
      // ── Header ──────────────────────────────────────────────
      {
        columns: [
          {
            image: path.resolve(__dirname, '../../public/deped-logo.png'),
            width: 50
          },
          {
            stack: [
              { text: 'Republic of the Philippines', alignment: 'center', fontSize: 9 },
              { text: 'Department of Education', alignment: 'center', fontSize: 12, bold: true, color: '#1d4ed8' },
              { text: 'Schools Division Office of Guihulngan City', alignment: 'center', fontSize: 9 },
              { text: 'Human Resource Merit Promotion and Selection Board', alignment: 'center', fontSize: 8, italics: true },
            ],
            width: '*'
          },
          { text: '', width: 50 } // Spacer for balance
        ]
      },
      { canvas: [{ type: 'line', x1: 0, y1: 10, x2: 515, y2: 10, lineWidth: 1, lineColor: '#1d4ed8' }] },
      { text: '\n' },

      { text: 'INDIVIDUAL EVALUATION SHEET (IES)', style: 'mainTitle', alignment: 'center', margin: [0, 10, 0, 20] },

      // ── Candidate Info ──────────────────────────────────────
      {
        table: {
          widths: ['20%', '30%', '20%', '30%'],
          body: [
            [
              { text: 'NAME OF APPLICANT:', style: 'label' },
              { text: candidateName, style: 'value', colSpan: 3 },
              {}, {}
            ],
            [
              { text: 'POSITION APPLIED:', style: 'label' },
              { text: job.positionTitle.toUpperCase(), style: 'value' },
              { text: 'DATE OF INTERVIEW:', style: 'label' },
              { text: new Date(interview.submittedAt || interview.createdAt).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }), style: 'value' }
            ],
            [
              { text: 'DIVISION/OFFICE:', style: 'label' },
              { text: 'Schools Division Office', style: 'value' },
              { text: 'PLANTILLA ITEM:', style: 'label' },
              { text: job.positionCode, style: 'value' }
            ]
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 25]
      },

      // ── Scoring Table ───────────────────────────────────────
      {
        table: {
          headerRows: 1,
          widths: ['40%', '15%', '45%'],
          body: [
            [
              { text: 'EVALUATION CRITERIA', style: 'tableHeader' },
              { text: 'SCORE', style: 'tableHeader' },
              { text: 'BEHAVIORAL EVIDENCE / REMARKS', style: 'tableHeader' }
            ],
            ...interview.criteria.map(c => [
              { text: c.label, bold: true, fontSize: 10, margin: [0, 8, 0, 8] },
              { text: `${c.score} / ${c.maxScore}`, alignment: 'center', bold: true, color: '#1d4ed8', margin: [0, 8, 0, 8] },
              { text: c.remarks || '---', fontSize: 8, italics: true, margin: [0, 8, 0, 8] }
            ]),
            [
              { text: 'TOTAL SCORE', alignment: 'right', bold: true, fillColor: '#f1f5f9', margin: [0, 5, 0, 5] },
              { text: `${totalScore.toFixed(2)} / ${maxPossible}`, alignment: 'center', bold: true, fillColor: '#f1f5f9', margin: [0, 5, 0, 5] },
              { text: `(${( (totalScore/maxPossible) * 100 ).toFixed(2)}% Overall Performance)`, fontSize: 8, alignment: 'center', fillColor: '#f1f5f9', margin: [0, 5, 0, 5] }
            ]
          ]
        }
      },

      { text: '\nOVERALL ASSESSMENT & RECOMMENDATION:', style: 'sectionTitle', margin: [0, 20, 0, 5] },
      { 
        table: {
          widths: ['*'],
          body: [[{ text: interview.overallRemarks || 'No additional remarks provided by the evaluator.', italics: true, fontSize: 10, minHeight: 60, padding: [10, 10, 10, 10] }]]
        }
      },

      { text: '\n\n' },

      // ── Signatures ──────────────────────────────────────────
      {
        columns: [
          { width: '*', text: '' },
          {
            width: 250,
            stack: [
              { text: 'I certify that the above evaluation is true and correct based on the results of the interview.', fontSize: 8, italics: true, margin: [0, 0, 0, 15] },
              { text: (interview.panelist?.name || panelistName).toUpperCase(), bold: true, alignment: 'center', fontSize: 11 },
              { canvas: [{ type: 'line', x1: 20, y1: 2, x2: 230, y2: 2, lineWidth: 1 }] },
              { text: 'Member, HRMPSB / Evaluator', fontSize: 9, alignment: 'center', margin: [0, 2, 0, 0] }
            ]
          }
        ],
        margin: [0, 40, 0, 0]
      }
    ],
    styles: {
      mainTitle: { fontSize: 14, bold: true, color: '#1e293b' },
      sectionTitle: { fontSize: 10, bold: true, uppercase: true, tracking: 1 },
      tableHeader: { fontSize: 9, bold: true, fillColor: '#1d4ed8', color: 'white', alignment: 'center', margin: [0, 5, 0, 5] },
      label: { fontSize: 8, bold: true, textTransform: 'uppercase', color: '#64748b' },
      value: { fontSize: 10, bold: true }
    },
    defaultStyle: { font: 'Roboto' }
  };

  return printer.createPdfKitDocument(docDefinition);
};

/**
 * 🔹 CAR-RQA (Comparative Assessment Result)
 * The "Bible" of the recruitment process. Multi-signatory.
 */
export const generateRQADoc = (data) => {
  const { job, rankings, schoolYear = "2023-2024", signatories = [] } = data;

  const docDefinition = {
    pageOrientation: 'landscape',
    pageSize: 'LEGAL',
    pageMargins: [30, 40, 30, 40],
    content: [
      { text: 'COMPARATIVE ASSESSMENT RESULT (CAR-RQA)', style: 'mainTitle', alignment: 'center' },
      { text: `Position: ${job.positionTitle} (${job.positionCode})`, style: 'subTitle', alignment: 'center', margin: [0, 5, 0, 20] },

      {
        table: {
          headerRows: 1,
          widths: ['4%', '24%', '8%', '8%', '8%', '10%', '8%', '10%', '10%', '10%'],
          body: [
            [
              { text: 'RANK', style: 'tableHeader' },
              { text: 'NAME OF APPLICANT', style: 'tableHeader' },
              { text: 'EDUC\n(20)', style: 'tableHeader' },
              { text: 'TRAIN\n(10)', style: 'tableHeader' },
              { text: 'EXP\n(15)', style: 'tableHeader' },
              { text: 'PBAC/BEI\n(35)', style: 'tableHeader' },
              { text: 'PERF\n(20)', style: 'tableHeader' },
              { text: 'TOTAL\n(100)', style: 'tableHeader' },
              { text: 'RESIDENCY', style: 'tableHeader' },
              { text: 'REMARKS', style: 'tableHeader' }
            ],
            ...rankings.map((item, idx) => [
              { text: item.rank || idx + 1, alignment: 'center' },
              { text: item.applicantName.toUpperCase(), bold: true, fontSize: 9 },
              { text: (item.educationPoints || 0).toFixed(2), alignment: 'center' },
              { text: (item.trainingPoints || 0).toFixed(2), alignment: 'center' },
              { text: (item.experiencePoints || 0).toFixed(2), alignment: 'center' },
              { text: (item.coiPoints || 0).toFixed(2), alignment: 'center' },
              { text: (item.performancePoints || 0).toFixed(2), alignment: 'center' },
              { text: (item.totalPoints || 0).toFixed(2), alignment: 'center', bold: true },
              { text: item.residencyPriority ? 'YES' : 'NO', alignment: 'center', fontSize: 8 },
              { text: item.isTie ? 'Tie-broken' : '', fontSize: 7, color: 'red' }
            ])
          ]
        },
        layout: 'lightHorizontalLines'
      },

      { text: '\n\n' },

      // HRMPSB Signatory Grid
      {
        table: {
          widths: ['33%', '33%', '33%'],
          body: [
            [
              { stack: [{ text: '\n\n____________________', alignment: 'center' }, { text: 'Member', fontSize: 8, alignment: 'center' }], border: [false, false, false, false] },
              { stack: [{ text: '\n\n____________________', alignment: 'center' }, { text: 'Member', fontSize: 8, alignment: 'center' }], border: [false, false, false, false] },
              { stack: [{ text: '\n\n____________________', alignment: 'center' }, { text: 'Member', fontSize: 8, alignment: 'center' }], border: [false, false, false, false] },
            ],
            [
              { stack: [{ text: '\n\n____________________', alignment: 'center' }, { text: 'Member', fontSize: 8, alignment: 'center' }], border: [false, false, false, false] },
              { stack: [{ text: '\n\n____________________', alignment: 'center' }, { text: 'Member', fontSize: 8, alignment: 'center' }], border: [false, false, false, false] },
              { stack: [{ text: '\n\n____________________', alignment: 'center' }, { text: 'Chairperson, HRMPSB', fontSize: 9, bold: true, alignment: 'center' }], border: [false, false, false, false] },
            ]
          ]
        },
        margin: [0, 20, 0, 40]
      },

      {
        stack: [
          { text: 'APPROVED:\n\n', fontSize: 10, bold: true, alignment: 'center' },
          { text: '____________________________________', alignment: 'center' },
          { text: 'Schools Division Superintendent', bold: true, alignment: 'center', fontSize: 11 },
          { text: 'Appointing Authority', alignment: 'center', fontSize: 9 }
        ]
      }
    ],
    styles: {
      mainTitle: { fontSize: 14, bold: true },
      subTitle: { fontSize: 10 },
      tableHeader: { fontSize: 7, bold: true, fillColor: '#f8fafc', alignment: 'center' }
    },
    defaultStyle: { font: 'Roboto', fontSize: 9 }
  };

  return printer.createPdfKitDocument(docDefinition);
};

/**
 * 🔹 CS FORM NO. 33-A (Appointment Form)
 */
export const generateCS33Form = (data) => {
  const { appointee, application, nature, status, salary, effectiveDate, formMetadata } = data;
  const job = application.submittedTo;

  const docDefinition = {
    pageSize: 'LEGAL',
    pageMargins: [40, 40, 40, 40],
    content: [
      { text: 'Republic of the Philippines', alignment: 'center', fontSize: 10 },
      { text: 'DEPARTMENT OF EDUCATION', alignment: 'center', bold: true, fontSize: 12 },
      { text: formMetadata?.station || 'Schools Division Office', alignment: 'center', fontSize: 10, margin: [0, 0, 0, 20] },

      { text: 'APPOINTMENT FORM', alignment: 'center', bold: true, fontSize: 14, margin: [0, 0, 0, 10] },
      { text: '(CS Form No. 33-A, Revised 2018)', alignment: 'center', fontSize: 8, margin: [0, 0, 0, 30] },

      {
        text: [
          'Mr./Ms. ', 
          { text: `${appointee.name?.firstName} ${appointee.name?.lastName}`.toUpperCase(), bold: true, decoration: 'underline' },
          '\n\n'
        ]
      },

      {
        text: [
          'You are hereby appointed as ',
          { text: job.positionTitle.toUpperCase(), bold: true },
          ' (SG-', { text: job.salaryGrade, bold: true }, ') ',
          'under ', { text: status.toUpperCase(), bold: true }, ' status ',
          'effective ', { text: new Date(effectiveDate).toLocaleDateString(), bold: true }, '.'
        ],
        lineHeight: 1.5
      },

      {
        margin: [0, 30, 0, 30],
        table: {
          widths: ['*', '*'],
          body: [
            [
              { text: 'Nature of Appointment:', bold: true, border: [false, false, false, false] },
              { text: nature.toUpperCase(), border: [false, false, false, true] }
            ],
            [
              { text: 'Compensation Rate:', bold: true, border: [false, false, false, false] },
              { text: `PHP ${Number(salary).toLocaleString()}`, border: [false, false, false, true] }
            ]
          ]
        }
      },

      {
        columns: [
          { width: '*', text: '' },
          {
            width: 200,
            stack: [
              { text: '\n\n\n__________________________', alignment: 'center' },
              { text: 'Appointing Authority', bold: true, alignment: 'center', fontSize: 10 },
              { text: 'SCHOOLS DIVISION SUPERINTENDENT', alignment: 'center', fontSize: 8 }
            ]
          }
        ]
      }
    ],
    defaultStyle: { font: 'Roboto', fontSize: 11 }
  };

  return printer.createPdfKitDocument(docDefinition);
};
