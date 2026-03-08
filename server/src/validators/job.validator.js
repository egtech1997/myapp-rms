import Joi from "joi";

export const jobSchema = Joi.object({
  positionTitle: Joi.string().required().min(3),
  positionCode: Joi.string().required(),
  description: Joi.string().required(),
  
  // Qualification Standards (QS)
  education: Joi.string().required(),
  experience: Joi.string().required(),
  minExperienceMonths: Joi.number().min(0).default(0),
  trainings: Joi.string().required(),
  minTrainingHours: Joi.number().min(0).default(0),
  eligibility: Joi.string().required(),
  competencyRequirements: Joi.array().items(Joi.string()).default([]),

  itemNumbers: Joi.array().items(Joi.string()).min(1).required(),
  salary: Joi.number().positive().required(),
  salaryGrade: Joi.number().integer().min(1).max(33).required(),
  placeOfAssignment: Joi.string().required(),
  employmentType: Joi.string().valid("permanent", "contractual", "job order", "casual"),
  hiringTrack: Joi.string().valid("teaching", "teaching_related", "non_teaching").required(),
  status: Joi.string().valid("draft", "published", "closed", "archived"),
  deadline: Joi.date().allow(null, ""),
});

export const jobUpdateSchema = Joi.object({
  positionTitle: Joi.string().min(3),
  positionCode: Joi.string(),
  description: Joi.string(),
  
  // Qualification Standards (QS)
  education: Joi.string(),
  experience: Joi.string(),
  minExperienceMonths: Joi.number().min(0),
  trainings: Joi.string(),
  minTrainingHours: Joi.number().min(0),
  eligibility: Joi.string(),
  competencyRequirements: Joi.array().items(Joi.string()),

  itemNumbers: Joi.array().items(Joi.string()).min(1),
  salary: Joi.number().positive(),
  salaryGrade: Joi.number().integer().min(1).max(33),
  placeOfAssignment: Joi.string(),
  employmentType: Joi.string().valid("permanent", "contractual", "job order", "casual"),
  hiringTrack: Joi.string().valid("teaching", "teaching_related", "non_teaching"),
  status: Joi.string().valid("draft", "published", "closed", "archived"),
  deadline: Joi.date().allow(null, ""),
});
