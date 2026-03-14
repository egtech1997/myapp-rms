import Joi from "joi";

const nameSchema = Joi.object({
  firstName: Joi.string().allow("", null).trim(),
  middleName: Joi.string().allow("", null).trim(),
  lastName:  Joi.string().allow("", null).trim(),
  suffix:    Joi.string().allow("", null).trim(),
});

const contactSchema = Joi.object({
  phones: Joi.array().items(Joi.string().allow("", null)),
  emails: Joi.array().items(Joi.string().email().allow("", null)),
});

const addressSchema = Joi.object({
  sitio: Joi.string().allow("", null),
  barangay: Joi.string().allow("", null),
  municipality: Joi.string().allow("", null),
  city: Joi.string().allow("", null),
  province: Joi.string().allow("", null),
  zipCode: Joi.string().allow("", null),
  country: Joi.string().default("Philippines"),
});

const familyMemberSchema = Joi.object({
  firstName: Joi.string().allow("", null),
  middleName: Joi.string().allow("", null),
  lastName: Joi.string().allow("", null),
  suffix: Joi.string().allow("", null),
  occupation: Joi.string().allow("", null),
  employer: Joi.string().allow("", null),
  businessAddress: Joi.string().allow("", null),
  phone: Joi.string().allow("", null),
});

export const profileValidator = Joi.object({
  name: nameSchema,
  sex: Joi.string().valid("male", "female", "prefer_not_to_say", "LGBTQ+").allow("", null),
  birthDate: Joi.date().allow(null, ""),
  isIndigenous: Joi.boolean().default(false),
  isSoloParent: Joi.boolean().default(false),
  religion:    Joi.string().allow("", null),
  disability:  Joi.string().allow("", null),
  civilStatus: Joi.string().valid("Single", "Married", "Widowed", "Separated", "Other").allow("", null),
  
  gsisNo: Joi.string().allow("", null),
  pagibigNo: Joi.string().allow("", null),
  philhealthNo: Joi.string().allow("", null),
  tinNo: Joi.string().allow("", null),
  philSysNo: Joi.string().allow("", null),
  agencyEmployeeNo: Joi.string().allow("", null),

  contact: contactSchema,
  currentAddress: addressSchema,
  comelecAddress: addressSchema.append({
    document:           Joi.string().allow("", null),
    documentUploadedAt: Joi.date().allow(null, ""),
  }),

  family: Joi.object({
    spouse: familyMemberSchema,
    father: familyMemberSchema,
    mother: familyMemberSchema,
    children: Joi.array().items(Joi.object({
      firstName: Joi.string().allow("", null),
      middleName: Joi.string().allow("", null),
      lastName: Joi.string().allow("", null),
      suffix: Joi.string().allow("", null),
      birthDate: Joi.date().allow(null, ""),
    })),
  }),

  eligibility: Joi.array().items(Joi.object({
    code: Joi.string().allow("", null),
    name: Joi.string().allow("", null),
    type: Joi.string().allow("", null),
    rating: Joi.string().allow("", null),
    dateOfExam: Joi.date().allow(null, ""),
    placeOfExam: Joi.string().allow("", null),
    licenseNumber:      Joi.string().allow("", null),
    licenseValidity:    Joi.date().allow(null, ""),
    document:           Joi.string().allow("", null),
    documentUploadedAt: Joi.date().allow(null, ""),
    licenseDocument:            Joi.string().allow("", null),
    licenseDocumentUploadedAt:  Joi.date().allow(null, ""),
  })),

  education: Joi.array().items(Joi.object({
    level: Joi.string().allow("", null),
    school: Joi.string().allow("", null),
    degree: Joi.string().allow("", null),
    periodFrom: Joi.string().allow("", null),
    periodTo: Joi.string().allow("", null),
    status: Joi.string().allow("", null),
    unitsEarned: Joi.string().allow("", null),
    yearGraduated: Joi.string().allow("", null),
    honorsReceived: Joi.string().allow("", null),
    tor:            Joi.string().allow("", null),
    torUploadedAt:  Joi.date().allow(null, ""),
    torPending:     Joi.boolean().allow(null),
    diploma:           Joi.string().allow("", null),
    diplomaUploadedAt: Joi.date().allow(null, ""),
    diplomaPending:    Joi.boolean().allow(null),
  })),

  training: Joi.array().items(Joi.object({
    title: Joi.string().allow("", null),
    dateIssued: Joi.date().allow(null, ""),
    hours: Joi.number().min(0).allow(null),
    typeOfLD: Joi.string().allow("", null),
    provider: Joi.string().allow("", null),
    document:           Joi.string().allow("", null),
    documentUploadedAt: Joi.date().allow(null, ""),
  })),

  experience: Joi.array().items(Joi.object({
    periodFrom: Joi.date().allow(null, ""),
    periodTo: Joi.date().allow(null, ""),
    position: Joi.string().allow("", null),
    company: Joi.string().allow("", null),
    monthlySalary: Joi.number().allow(null),
    salaryGrade: Joi.string().allow("", null),
    statusOfAppointment: Joi.string().allow("", null),
    serviceType: Joi.string().valid("Government", "Private", "Self-Employed").allow("", null),
    companyEmail: Joi.string().email().allow("", null),
    companyPhone: Joi.string().allow("", null),
    keyResponsibilities: Joi.array().items(Joi.string().allow("", null)),
    document:           Joi.string().allow("", null),
    documentUploadedAt: Joi.date().allow(null, ""),
  })),

  voluntaryWork: Joi.array().items(Joi.object({
    organization: Joi.string().allow("", null),
    periodFrom: Joi.date().allow(null, ""),
    periodTo: Joi.date().allow(null, ""),
    hours: Joi.number().allow(null),
    position: Joi.string().allow("", null),
  })),

  competencies: Joi.array().items(Joi.string().allow("", null)),
  specialSkills: Joi.array().items(Joi.string().allow("", null)),
  nonAcademicDistinctions: Joi.array().items(Joi.string().allow("", null)),
  memberships: Joi.array().items(Joi.string().allow("", null)),

  pdsQuestions: Joi.object({
    q34a: Joi.boolean(), q34b: Joi.boolean(),
    q35a: Joi.boolean(), q35b: Joi.boolean(),
    q36:  Joi.boolean(),
    q37:  Joi.boolean(),
    q38a: Joi.boolean(), q38b: Joi.boolean(),
    q39:  Joi.boolean(),
    q40a: Joi.boolean(), q40b: Joi.boolean(), q40c: Joi.boolean(),
    q34_details: Joi.string().allow("", null),
    q35_details: Joi.string().allow("", null),
    q36_details: Joi.string().allow("", null),
    q37_details: Joi.string().allow("", null),
    q38_details: Joi.string().allow("", null),
    q39_details: Joi.string().allow("", null),
    q40_details: Joi.string().allow("", null),
  }),

  references: Joi.array().items(Joi.object({
    name: Joi.string().allow("", null),
    address: Joi.string().allow("", null),
    phone: Joi.string().allow("", null),
  })),
  
  performanceRating: Joi.object({
    score: Joi.number().allow(null).empty('').optional(),
    adjective: Joi.string().allow("", null),
    periodCovered: Joi.string().allow("", null),
  }),

  visibility: Joi.object({
    phone: Joi.boolean().default(false),
    email: Joi.boolean().default(false),
    address: Joi.boolean().default(false),
  }),
});
