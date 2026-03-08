import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const PdfPrinter = require('pdfmake/js/Printer').default;

// Standard fonts for pdfmake
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
 * 🔹 RQA PDF TEMPLATE (Landscape)
 */
export const generateRQADoc = (data) => {
  const { job, rankings, schoolYear = "2023-2024" } = data;

  const docDefinition = {
    pageOrientation: 'landscape',
    pageSize: 'LEGAL',
    pageMargins: [40, 60, 40, 60],
    
    header: (currentPage, pageCount) => {
      return {
        columns: [
          { text: 'Republic of the Philippines\nDepartment of Education', style: 'headerSub', alignment: 'center', margin: [0, 20, 0, 0] },
        ]
      };
    },

    footer: (currentPage, pageCount) => {
      return {
        text: `Page ${currentPage} of ${pageCount}`,
        alignment: 'center',
        style: 'footer'
      };
    },

    content: [
      { text: 'COMPARATIVE ASSESSMENT RESULT (CAR-RQA)', style: 'mainTitle', alignment: 'center' },
      { text: `Position: ${job.positionTitle} (${job.positionCode})`, style: 'subTitle', alignment: 'center', margin: [0, 5, 0, 5] },
      { text: `School Year: ${schoolYear}`, style: 'subTitle', alignment: 'center', margin: [0, 0, 0, 20] },

      {
        table: {
          headerRows: 1,
          widths: ['auto', '*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
          body: [
            // Header Row
            [
              { text: 'RANK', style: 'tableHeader' },
              { text: 'NAME OF APPLICANT', style: 'tableHeader' },
              { text: 'EDUC (20)', style: 'tableHeader' },
              { text: 'TRAIN (10)', style: 'tableHeader' },
              { text: 'EXP (15)', style: 'tableHeader' },
              { text: 'PBAC (35)', style: 'tableHeader' },
              { text: 'OTHERS (20)', style: 'tableHeader' },
              { text: 'TOTAL', style: 'tableHeader' },
              { text: 'REMARKS', style: 'tableHeader' }
            ],
            // Data Rows
            ...rankings.map((item, idx) => [
              { text: item.rank || idx + 1, alignment: 'center' },
              { text: item.applicantName.toUpperCase(), bold: true },
              { text: (item.educationPoints || 0).toFixed(2), alignment: 'center' },
              { text: (item.trainingPoints || 0).toFixed(2), alignment: 'center' },
              { text: (item.experiencePoints || 0).toFixed(2), alignment: 'center' },
              { text: (item.coiPoints || 0).toFixed(2), alignment: 'center' }, // BEI/PBAC
              { text: '0.00', alignment: 'center' }, // Placeholder for Performance/Outstanding
              { text: (item.totalPoints || 0).toFixed(2), alignment: 'center', bold: true, color: '#1d4ed8' },
              { text: item.isTie ? 'Tie-broken' : '', fontSize: 8, color: 'red' }
            ])
          ]
        },
        layout: {
          hLineWidth: (i, node) => (i === 0 || i === node.table.body.length) ? 2 : 1,
          vLineWidth: (i, node) => (i === 0 || i === node.table.widths.length) ? 2 : 1,
          hLineColor: (i, node) => (i === 0 || i === node.table.body.length) ? 'black' : '#cccccc',
          vLineColor: (i, node) => (i === 0 || i === node.table.widths.length) ? 'black' : '#cccccc',
        }
      },

      // Certification Section
      {
        columns: [
          {
            width: '*',
            text: '\n\n\n__________________________\nPBAC SECRETARIAT',
            alignment: 'center',
            style: 'signature'
          },
          {
            width: '*',
            text: '\n\n\n__________________________\nPBAC CHAIRMAN',
            alignment: 'center',
            style: 'signature'
          }
        ]
      }
    ],

    styles: {
      mainTitle: { fontSize: 16, bold: true, font: 'Roboto' },
      subTitle: { fontSize: 11, font: 'Roboto' },
      tableHeader: { fontSize: 9, bold: true, fillColor: '#f1f5f9', alignment: 'center', margin: [0, 5, 0, 5] },
      footer: { fontSize: 8, font: 'Roboto', color: '#94a3b8' },
      signature: { fontSize: 10, bold: true, font: 'Roboto' },
      headerSub: { fontSize: 10, font: 'Roboto' }
    },
    defaultStyle: { fontSize: 10, font: 'Roboto' }
  };

  return printer.createPdfKitDocument(docDefinition);
};

/**
 * 🔹 CS FORM NO. 33-A (REVISED 2018)
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
