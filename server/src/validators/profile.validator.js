import Joi from "joi";

const nameSchema = Joi.object({
  firstName: Joi.string().required().trim().messages({
    'string.empty': 'First Name is required',
    'any.required': 'First Name is required'
  }),
  middleName: Joi.string().allow("", null).trim(),
  lastName: Joi.string().required().trim().messages({
    'string.empty': 'Last Name is required',
    'any.required': 'Last Name is required'
  }),
  suffix: Joi.string().allow("", null).trim(),
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
  sex: Joi.string().valid("male", "female", "prefer_not_to_say").allow("", null),
  birthDate: Joi.date().allow(null),
  ethnicGroup: Joi.string().allow("", null),
  religion:    Joi.string().allow("", null),
  disability:  Joi.string().allow("", null),
  civilStatus: Joi.string().valid("Single", "Married", "Widowed", "Separated", "Other").allow("", null),
  
  gsisNo: Joi.string().allow("", null),
  pagibigNo: Joi.string().allow("", null),
  philhealthNo: Joi.string().allow("", null),
  sssNo: Joi.string().allow("", null),
  tinNo: Joi.string().allow("", null),
  agencyEmployeeNo: Joi.string().allow("", null),

  contact: contactSchema,
  address: addressSchema,

  family: Joi.object({
    spouse: familyMemberSchema,
    father: familyMemberSchema,
    mother: familyMemberSchema,
    children: Joi.array().items(Joi.object({
      firstName: Joi.string().allow("", null),
      middleName: Joi.string().allow("", null),
      lastName: Joi.string().allow("", null),
      suffix: Joi.string().allow("", null),
      birthDate: Joi.date().allow(null),
    })),
  }),

  eligibility: Joi.array().items(Joi.object({
    code: Joi.string().allow("", null),
    name: Joi.string().required(),
    type: Joi.string().allow("", null),
    rating: Joi.string().allow("", null),
    dateOfExam: Joi.date().allow(null, ""),
    placeOfExam: Joi.string().allow("", null),
    licenseNumber: Joi.string().allow("", null),
    licenseValidity: Joi.date().allow(null, ""),
  })),

  education: Joi.array().items(Joi.object({
    level: Joi.string().required(),
    school: Joi.string().required(),
    degree: Joi.string().allow("", null),
    periodFrom: Joi.string().allow("", null),
    periodTo: Joi.string().allow("", null),
    status: Joi.string().allow("", null),
    unitsEarned: Joi.string().allow("", null),
    yearGraduated: Joi.string().allow("", null),
    honorsReceived: Joi.string().allow("", null),
  })),

  training: Joi.array().items(Joi.object({
    title: Joi.string().required(),
    dateIssued: Joi.date().allow(null, ""),
    hours: Joi.number().min(0).allow(null),
    typeOfLD: Joi.string().allow("", null),
    provider: Joi.string().allow("", null),
  })),

  experience: Joi.array().items(Joi.object({
    periodFrom: Joi.date().allow(null, ""),
    periodTo: Joi.date().allow(null, ""),
    position: Joi.string().required(),
    company: Joi.string().required(),
    monthlySalary: Joi.number().allow(null),
    salaryGrade: Joi.string().allow("", null),
    statusOfAppointment: Joi.string().allow("", null),
    isGovernment: Joi.boolean().default(false),
    keyResponsibilities: Joi.array().items(Joi.string().allow("", null)),
  })),

  voluntaryWork: Joi.array().items(Joi.object({
    organization: Joi.string().required(),
    periodFrom: Joi.date().allow(null, ""),
    periodTo: Joi.date().allow(null, ""),
    hours: Joi.number().allow(null),
    position: Joi.string().allow("", null),
  })),

  competencies: Joi.array().items(Joi.string().allow("", null)),
  specialSkills: Joi.array().items(Joi.string().allow("", null)),
  nonAcademicDistinctions: Joi.array().items(Joi.string().allow("", null)),
  memberships: Joi.array().items(Joi.string().allow("", null)),
  
  performanceRating: Joi.object({
    score: Joi.number().allow(null),
    adjective: Joi.string().allow("", null),
    periodCovered: Joi.string().allow("", null),
  }),

  visibility: Joi.object({
    phone: Joi.boolean().default(false),
    email: Joi.boolean().default(false),
    address: Joi.boolean().default(false),
  }),
});
