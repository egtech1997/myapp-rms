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
  },
  Courier: {
    normal:      'Courier',
    bold:        'Courier-Bold',
    italics:     'Courier-Oblique',
    bolditalics: 'Courier-BoldOblique'
  }
};

const printer = new PdfPrinter(fonts);

/**
 * Official DepEd Header (Dual Logo)
 */
const getOfficialHeader = () => ({
  columns: [
    { width: '*', text: '' }, // Flexible spacer left
    {
      image: path.resolve(__dirname, '../../public/deped-national-logo.png'),
      width: 45,
      margin: [0, 0, 10, 0] // 10px right margin to be beside labels
    },
    {
      stack: [
        { text: 'Republic of the Philippines', fontSize: 8, alignment: 'center' },
        { text: 'Department of Education', fontSize: 12, bold: true, alignment: 'center', color: '#1d4ed8' },
        { text: 'Negros Island Region (NIR)', fontSize: 9, alignment: 'center' },
        { text: 'SCHOOLS DIVISION OFFICE OF GUIHULNGAN CITY', fontSize: 10, bold: true, alignment: 'center' }
      ],
      width: 'auto'
    },
    {
      image: path.resolve(__dirname, '../../public/deped-logo.png'),
      width: 45,
      margin: [10, 0, 0, 0] // 10px left margin to be beside labels
    },
    { width: '*', text: '' } // Flexible spacer right
  ],
  margin: [0, 0, 0, 5]
});

const getHeaderLine = (width = 890) => ({ 
  canvas: [{ type: 'line', x1: 0, y1: 0, x2: width, y2: 0, lineWidth: 1.5, lineColor: '#000000' }], 
  margin: [0, 0, 0, 10] 
});

/**
 * Helper to extract a field from a string that looks like an object (Mongoose/inspect format)
 */
const extractField = (str, field) => {
  if (!str || typeof str !== 'string') return null;
  // Try quoted: field: 'value' or field: "value"
  let match = str.match(new RegExp(`${field}:\\s*['"]([^'"]+)['"]`));
  if (match) return match[1];
  // Try unquoted (for dates/numbers): field: 2023-10-26T...
  match = str.match(new RegExp(`${field}:\\s*([^,\\s}]+)`));
  if (match) return match[1];
  return null;
};

/**
 * Helper to extract a string from a potentially nested object or array
 */
const extractString = (val) => {
  if (!val) return '—';
  
  if (val instanceof Date) return val.toISOString();

  if (typeof val === 'string') {
    const trimmed = val.trim();
    
    // Handle JSON strings
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        return extractString(parsed);
      } catch (e) {
        // If not valid JSON, try to extract 'name', 'label', or 'type' using regex (handles Mongoose/inspect format)
        const name = extractField(trimmed, 'name') || extractField(trimmed, 'label') || extractField(trimmed, 'type') || extractField(trimmed, 'title');
        if (name) return name;
      }
    }
    return val;
  }
  
  if (Array.isArray(val)) {
    if (val.length === 0) return '—';
    return val.map(v => extractString(v)).filter(v => v && v !== '—').join(', ');
  }
  
  if (typeof val === 'object') {
    // Prioritize most descriptive fields
    return val.label || val.name || val.type || val.title || val.value || JSON.stringify(val);
  }
  
  return String(val);
};

/**
 * Helper to shorten eligibility names for report space
 */
const shortenEligibility = (name) => {
  const raw = extractString(name);
  if (!raw || raw === '—') return '';
  let n = raw.toUpperCase().trim();
  
  // Remove "TYPE:" prefix if it exists (handles Mongoose object-to-string quirks)
  n = n.replace(/^TYPE:\s*/, '').replace(/['"]/g, '');
  if (n === '—' || n === '') return '';
  
  // ── 2nd Level (LPT, BAR, RA1080, 2ND LEVEL) ──
  if (n.includes('TEACHER') || n.includes('LET') || n.includes('LPT')) return 'LPT';
  if (n.includes('BAR') && n.includes('PHILIPPINES')) return 'BAR';
  if (n.includes('RA 1080') || n.includes('RA1080') || n.includes('PRC') || n.includes('LICENSURE')) return 'RA1080';
  if (n.includes('2ND LEVEL') || n.includes('SECOND LEVEL') || (n.includes('PROFESSIONAL') && !n.includes('SUB'))) return '2ND LEVEL';
  
  // ── 1st Level (1ST LEVEL, BRGY OFF, BHW) ──
  if (n.includes('1ST LEVEL') || n.includes('FIRST LEVEL') || n.includes('SUBPROFESSIONAL')) return '1ST LEVEL';
  if (n.includes('BARANGAY OFFICIAL') || n.includes('MC 11')) return 'BRGY OFF';
  if (n.includes('BARANGAY HEALTH WORKER') || n.includes('RA 7883')) return 'BHW';
  
  // ── General / Catch-all ──
  if (n.includes('CSC') || n.includes('CIVIL SERVICE')) return 'CSC';
  
  return n.length > 15 ? n.substring(0, 13) + '..' : n;
};

/**
 * Helper to calculate total training hours
 */
const calculateTotalTrainingHours = (trainings) => {
  return (trainings || [])
    .filter(t => t.isRelevant !== false && t.hours)
    .reduce((sum, t) => sum + (Number(t.hours) || 0), 0);
};

/**
 * Helper to calculate total years/months from multiple experience entries
 */
const calculateTotalExperience = (experiences) => {
  const relevant = (experiences || []).filter(e => e.isRelevant !== false && e.periodFrom);
  if (relevant.length === 0) return '0 mos';

  let totalMonths = 0;
  relevant.forEach(e => {
    const start = new Date(e.periodFrom);
    const end = e.isPresent ? new Date() : (e.periodTo ? new Date(e.periodTo) : new Date());
    
    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    totalMonths += (years * 12) + months;
  });

  const yrs = Math.floor(totalMonths / 12);
  const mos = totalMonths % 12;
  
  const yStr = yrs > 0 ? `${yrs} yr${yrs > 1 ? 's' : ''}` : '';
  const mStr = mos > 0 ? `${mos} mo${mos > 1 ? 's' : ''}` : '';
  
  return [yStr, mStr].filter(Boolean).join(' ') || '0 mos';
};

/**
 * 🔹 IER (Initial Evaluation Result)
 */
export const generateIERDoc = (data) => {
  const { job, applicants, dateEvaluated = new Date() } = data;
  
  const sortedApplicants = [...applicants].sort((a, b) => {
    const pA = a.applicantData?.personalInfo;
    const pB = b.applicantData?.personalInfo;
    return (pA?.lastName || "").localeCompare(pB?.lastName || "");
  });

  const fullName = (a) => {
    const p = a.applicantData?.personalInfo;
    if (!p) return "Unknown";
    return `${p.lastName}, ${p.firstName} ${p.middleName || ""} ${p.suffix || ""}`.toUpperCase();
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return "—";
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const docDefinition = {
    pageSize: { width: 936, height: 612 }, // 13" x 8.5" (Folio)
    pageMargins: [20, 20, 20, 20],
    content: [
      getOfficialHeader(),
      getHeaderLine(896),

      { text: 'INITIAL EVALUATION RESULT (IER)', fontSize: 14, bold: true, alignment: 'center', margin: [0, 0, 0, 15] },

      {
        columns: [
          {
            width: '45%',
            stack: [
              {
                columns: [
                  { text: 'Position:', fontSize: 7, bold: true, width: 80 },
                  { text: job.positionTitle.toUpperCase(), fontSize: 7, decoration: 'underline', width: '*' }
                ],
                margin: [0, 0, 0, 1]
              },
              {
                columns: [
                  { text: 'Salary Grade and Monthly Salary:', fontSize: 7, bold: true, width: 80 },
                  { text: `SG-${job.salaryGrade} / Php ${Number(job.monthlySalary || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, fontSize: 7, decoration: 'underline', width: '*' }
                ],
                margin: [0, 0, 0, 1]
              },
              { text: 'Qualification Standards:', fontSize: 7, bold: true, margin: [0, 1, 0, 1] },
              {
                columns: [
                  { text: '   Education:', fontSize: 7, italic: true, width: 80 },
                  { text: job.qs?.education || 'None Required', fontSize: 7, decoration: 'underline', width: '*' }
                ],
                margin: [0, 0, 0, 1]
              },
              {
                columns: [
                  { text: '   Experience:', fontSize: 7, italic: true, width: 80 },
                  { text: job.qs?.experience || 'None Required', fontSize: 7, decoration: 'underline', width: '*' }
                ],
                margin: [0, 0, 0, 1]
              },
              {
                columns: [
                  { text: '   Training:', fontSize: 7, italic: true, width: 80 },
                  { text: job.qs?.training || 'None Required', fontSize: 7, decoration: 'underline', width: '*' }
                ],
                margin: [0, 0, 0, 1]
              },
              {
                columns: [
                  { text: '   Eligibility:', fontSize: 7, italic: true, width: 80 },
                  { text: job.qs?.eligibility || 'None Required', fontSize: 7, decoration: 'underline', width: '*' }
                ],
                margin: [0, 0, 0, 1]
              }
            ]
          },
          { width: '*', text: '' }
        ],
        margin: [0, 0, 0, 10]
      },

      {
        table: {
          headerRows: 1,
          widths: [12, 35, 75, 70, 18, 18, 25, 30, 28, 30, 50, 45, 70, 60, 20, 100, 60, 60, 55],
          body: [
            [
              { text: 'No.', style: 'tableHeader' },
              { text: 'Application Code', style: 'tableHeader' },
              { text: 'Name of Applicant', style: 'tableHeader' },
              { text: 'Address', style: 'tableHeader' },
              { text: 'Age', style: 'tableHeader' },
              { text: 'Sex', style: 'tableHeader' },
              { text: 'Status', style: 'tableHeader' },
              { text: 'Religion', style: 'tableHeader' },
              { text: 'Disability', style: 'tableHeader' },
              { text: 'Ethnic', style: 'tableHeader' },
              { text: 'Email', style: 'tableHeader' },
              { text: 'Contact', style: 'tableHeader' },
              { text: 'Education', style: 'tableHeader' },
              { text: 'Training', style: 'tableHeader' },
              { text: 'Hrs', style: 'tableHeader' },
              { text: 'Experience', style: 'tableHeader' },
              { text: 'Total Yrs/Mos', style: 'tableHeader' },
              { text: 'Eligibility', style: 'tableHeader' },
              { text: 'Remarks', style: 'tableHeader' }
            ],
            ...sortedApplicants.map((a, i) => {
              const p = a.applicantData?.personalInfo || {};
              const addr = p.address || {};
              const educ = a.applicantData?.education || [];
              const trng = a.applicantData?.training || [];
              const exp = a.applicantData?.experience || [];
              const elig = a.applicantData?.eligibility || [];
              
              const bgy = extractString(addr.barangay);
              const mun = extractString(addr.municipality);
              const prv = extractString(addr.province);
              const cleanAddr = `${bgy !== '—' ? bgy : ''}, ${mun !== '—' ? mun : ''}, ${prv !== '—' ? prv : ''}`.replace(/^, |, $/, '').toUpperCase();

              return [
                { text: i + 1, alignment: 'center', fontSize: 6 },
                { text: a.applicationCode, alignment: 'center', fontSize: 6, font: 'Courier' },
                { text: fullName(a), fontSize: 7, bold: true },
                { text: cleanAddr, fontSize: 5 },
                { text: calculateAge(p.birthDate), alignment: 'center', fontSize: 6 },
                { text: p.sex?.toUpperCase()?.charAt(0) || '—', alignment: 'center', fontSize: 6 },
                { text: p.civilStatus?.toUpperCase() || '—', alignment: 'center', fontSize: 6 },
                { text: extractString(p.religion).toUpperCase(), alignment: 'center', fontSize: 5 },
                { text: extractString(p.disability).toUpperCase(), alignment: 'center', fontSize: 5 },
                { text: extractString(p.ethnicGroup).toUpperCase(), alignment: 'center', fontSize: 5 },
                { text: p.emails?.join('\n\n') || p.contact?.email || '—', fontSize: 5 },
                { text: p.phones?.join('\n\n') || p.contact?.phone || '—', fontSize: 5 },
                { 
                  stack: educ.filter(e => e.isRelevant !== false).map(e => ({ text: extractString(e.degree).toUpperCase(), fontSize: 5, margin: [0, 2] })),
                  margin: [0, 2]
                },
                { 
                  stack: trng.filter(t => t.isRelevant !== false).map(t => ({ text: extractString(t.title).toUpperCase(), fontSize: 5, margin: [0, 2] })),
                  margin: [0, 2]
                },
                { text: calculateTotalTrainingHours(trng), alignment: 'center', fontSize: 6 },
                { 
                  stack: exp.filter(e => e.isRelevant !== false).map(e => ({ text: extractString(e.position).toUpperCase(), fontSize: 5, margin: [0, 2] })),
                  margin: [0, 2]
                },
                { text: calculateTotalExperience(exp), alignment: 'center', fontSize: 6 },
                { 
                  stack: elig.filter(e => e.isRelevant !== false).map(e => {
                    const raw = e.name || e.type || e.category || e;
                    const val = (typeof raw === 'object') 
                      ? (raw.label || raw.name || raw.type || raw.value || JSON.stringify(raw)) 
                      : raw;
                    const shortened = shortenEligibility(val);
                    return shortened ? { text: shortened, fontSize: 5, margin: [0, 2] } : null;
                  }).filter(item => item !== null),
                  margin: [0, 2]
                },
                { 
                  text: (elig.filter(e => e.isRelevant !== false).length === 0) ? '—' : '',
                  fontSize: 6, alignment: 'center'
                },
                { text: a.isQualified ? 'QUALIFIED' : 'DISQUALIFIED', alignment: 'center', fontSize: 7, bold: true, color: a.isQualified ? 'black' : 'red' }
              ];
            })
          ]
        },
        layout: {
          hLineWidth: (i, node) => 0.5,
          vLineWidth: (i, node) => 0.5,
          hLineColor: (i, node) => '#000000',
          vLineColor: (i, node) => '#000000',
          paddingLeft: (i) => 2,
          paddingRight: (i) => 2,
          paddingTop: (i) => 2,
          paddingBottom: (i) => 2,
        }
      },

      { text: '\n\n' },

      {
        table: {
          widths: ['33%', '33%', '33%'],
          body: [
            [
              { stack: [{ text: '\n\n____________________', alignment: 'center' }, { text: 'Member, HRMPSB', fontSize: 8, alignment: 'center' }], border: [false, false, false, false] },
              { stack: [{ text: '\n\n____________________', alignment: 'center' }, { text: 'Member, HRMPSB', fontSize: 8, alignment: 'center' }], border: [false, false, false, false] },
              { stack: [{ text: '\n\n____________________', alignment: 'center' }, { text: 'Member, HRMPSB', fontSize: 8, alignment: 'center' }], border: [false, false, false, false] },
            ],
            [
              { stack: [{ text: '\n\n____________________', alignment: 'center' }, { text: 'Member, HRMPSB', fontSize: 8, alignment: 'center' }], border: [false, false, false, false] },
              { stack: [{ text: '\n\n____________________', alignment: 'center' }, { text: 'Member, HRMPSB', fontSize: 8, alignment: 'center' }], border: [false, false, false, false] },
              { stack: [{ text: '\n\n____________________', alignment: 'center' }, { text: 'Chairperson, HRMPSB', fontSize: 9, bold: true, alignment: 'center' }], border: [false, false, false, false] },
            ]
          ]
        },
        layout: 'noBorders'
      }
    ],
    styles: {
      tableHeader: {
        fontSize: 7,
        bold: true,
        fillColor: '#1d4ed8',
        color: '#ffffff',
        alignment: 'center'
      }
    },
    defaultStyle: { font: 'Roboto', fontSize: 11 }
  };

  return printer.createPdfKitDocument(docDefinition);
};

/**
 * 🔹 DIGITAL IES (Interview Evaluation Sheet)
 */
export const generateIESDoc = (data) => {
  const { job, applicant, scores, totalScore, averageScore, dateEvaluated = new Date() } = data;

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 40],
    content: [
      getOfficialHeader(),
      getHeaderLine(515),

      { text: 'INTERVIEW EVALUATION SHEET (IES)', fontSize: 16, bold: true, alignment: 'center', margin: [0, 0, 0, 20] },

      {
        columns: [
          {
            width: '50%',
            stack: [
              { text: `APPLICANT: ${applicant.name?.toUpperCase()}`, fontSize: 10, bold: true },
              { text: `POSITION: ${job.positionTitle?.toUpperCase()}`, fontSize: 9, margin: [0, 2] },
            ]
          },
          {
            width: '50%',
            stack: [
              { text: `DATE: ${new Date(dateEvaluated).toLocaleDateString()}`, fontSize: 9, alignment: 'right' },
              { text: `TRACK: ${job.hiringTrack?.replace('_', ' ').toUpperCase()}`, fontSize: 9, alignment: 'right' }
            ]
          }
        ],
        margin: [0, 0, 0, 20]
      },

      {
        table: {
          widths: ['*', 60, 60],
          body: [
            [
              { text: 'CRITERIA', style: 'tableHeader' },
              { text: 'MAX', style: 'tableHeader' },
              { text: 'SCORE', style: 'tableHeader' }
            ],
            ...scores.map(s => [
              { text: s.criterion, fontSize: 9 },
              { text: s.maxPoints, alignment: 'center', fontSize: 9 },
              { text: s.score, alignment: 'center', fontSize: 9, bold: true }
            ]),
            [
              { text: 'TOTAL SCORE', bold: true, fillColor: '#f3f4f6' },
              { text: '100', alignment: 'center', bold: true, fillColor: '#f3f4f6' },
              { text: totalScore, alignment: 'center', bold: true, fillColor: '#f3f4f6' }
            ]
          ]
        }
      },

      {
        margin: [0, 40, 0, 0],
        columns: [
          { width: '*', text: '' },
          {
            width: 200,
            stack: [
              { text: 'Evaluated by:', fontSize: 9, italic: true, margin: [0, 0, 0, 30] },
              { text: '____________________', alignment: 'center' },
              { text: 'Member, HRMPSB', alignment: 'center', fontSize: 8 }
            ]
          }
        ]
      }
    ],
    styles: {
      tableHeader: {
        fontSize: 10,
        bold: true,
        fillColor: '#1d4ed8',
        color: '#ffffff',
        alignment: 'center'
      }
    },
    defaultStyle: { font: 'Roboto' }
  };

  return printer.createPdfKitDocument(docDefinition);
};

/**
 * 🔹 CS FORM 33-A (REVISED 2018) - APPOINTMENT FORM
 */
export const generateCS33Form = (data) => {
  const { appointee, application, nature, status, salary, effectiveDate, formMetadata = {} } = data;
  const job = application?.submittedTo || {};

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 40],
    content: [
      getOfficialHeader(),
      getHeaderLine(515),

      { text: 'CS Form No. 33-A', fontSize: 8, italic: true, alignment: 'right' },
      { text: 'Revised 2018', fontSize: 8, italic: true, alignment: 'right', margin: [0, 0, 0, 10] },

      { text: 'APPOINTMENT FORM', fontSize: 16, bold: true, alignment: 'center', margin: [0, 0, 0, 20] },

      {
        text: [
          { text: 'Mr./Ms. ' },
          { text: `${appointee.name || appointee.username}`.toUpperCase(), bold: true, decoration: 'underline' }
        ],
        fontSize: 11,
        margin: [0, 0, 0, 15]
      },

      {
        text: [
          { text: 'You are hereby appointed as ' },
          { text: `${job.positionTitle}`.toUpperCase(), bold: true, decoration: 'underline' },
          { text: ` (SG-${job.salaryGrade})` },
          { text: ' under ' },
          { text: `${status}`.toUpperCase(), bold: true, decoration: 'underline' },
          { text: ' status in the ' },
          { text: 'DEPARTMENT OF EDUCATION', bold: true },
          { text: ' effective ' },
          { text: `${new Date(effectiveDate).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}`.toUpperCase(), bold: true, decoration: 'underline' },
          { text: '.' }
        ],
        fontSize: 11,
        lineHeight: 1.5,
        margin: [0, 0, 0, 20]
      },

      {
        columns: [
          {
            width: '50%',
            stack: [
              { text: 'Nature of Appointment:', fontSize: 9, italic: true },
              { text: nature.toUpperCase(), fontSize: 11, bold: true, margin: [10, 2, 0, 0] }
            ]
          },
          {
            width: '50%',
            stack: [
              { text: 'Monthly Salary:', fontSize: 9, italic: true },
              { text: `Php ${Number(salary || job.monthlySalary || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, fontSize: 11, bold: true, margin: [10, 2, 0, 0] }
            ]
          }
        ],
        margin: [0, 0, 0, 30]
      },

      {
        stack: [
          { text: 'Very truly yours,', fontSize: 11, margin: [0, 0, 0, 40] },
          { text: (formMetadata.signatoryName || 'SDS NAME HERE').toUpperCase(), fontSize: 12, bold: true, alignment: 'center', decoration: 'underline' },
          { text: (formMetadata.signatoryTitle || 'Schools Division Superintendent').toUpperCase(), fontSize: 10, alignment: 'center' }
        ],
        margin: [250, 0, 0, 0]
      }
    ],
    defaultStyle: { font: 'Roboto' }
  };

  return printer.createPdfKitDocument(docDefinition);
};

/**
 * 🔹 CAR-RQA (Comparative Assessment Result)
 */
export const generateRQADoc = (data) => {
  const { job, rankings, schoolYear } = data;

  const docDefinition = {
    pageSize: 'A4',
    pageOrientation: 'landscape',
    pageMargins: [30, 30, 30, 30],
    content: [
      getOfficialHeader(),
      getHeaderLine(780),

      { text: 'COMPARATIVE ASSESSMENT RESULT (CAR-RQA)', fontSize: 14, bold: true, alignment: 'center', margin: [0, 0, 0, 5] },
      { text: `School Year: ${schoolYear}`, fontSize: 10, alignment: 'center', margin: [0, 0, 0, 15] },

      {
        table: {
          headerRows: 1,
          widths: [20, '*', 50, 50, 50, 50, 50, 50, 50, 60],
          body: [
            [
              { text: 'Rank', style: 'tableHeader' },
              { text: 'Name of Candidate', style: 'tableHeader' },
              { text: 'Educ', style: 'tableHeader' },
              { text: 'Train', style: 'tableHeader' },
              { text: 'Exp', style: 'tableHeader' },
              { text: 'Perf', style: 'tableHeader' },
              { text: 'Board', style: 'tableHeader' },
              { text: 'COI', style: 'tableHeader' },
              { text: 'Total', style: 'tableHeader' },
              { text: 'Remarks', style: 'tableHeader' }
            ],
            ...rankings.map((r, i) => [
              { text: i + 1, alignment: 'center', fontSize: 8 },
              { text: r.applicantName?.toUpperCase(), fontSize: 8, bold: true },
              { text: r.educationPoints || 0, alignment: 'center', fontSize: 8 },
              { text: r.trainingPoints || 0, alignment: 'center', fontSize: 8 },
              { text: r.experiencePoints || 0, alignment: 'center', fontSize: 8 },
              { text: r.performancePoints || 0, alignment: 'center', fontSize: 8 },
              { text: r.boardRating || 0, alignment: 'center', fontSize: 8 },
              { text: r.coiPoints || 0, alignment: 'center', fontSize: 8 },
              { text: r.totalPoints || 0, alignment: 'center', fontSize: 9, bold: true },
              { text: r.totalPoints >= 50 ? 'QUALIFIED' : 'NOT QUALIFIED', fontSize: 7, alignment: 'center' }
            ])
          ]
        }
      }
    ],
    styles: {
      tableHeader: {
        fontSize: 9,
        bold: true,
        fillColor: '#1d4ed8',
        color: '#ffffff',
        alignment: 'center'
      }
    },
    defaultStyle: { font: 'Roboto' }
  };

  return printer.createPdfKitDocument(docDefinition);
};
