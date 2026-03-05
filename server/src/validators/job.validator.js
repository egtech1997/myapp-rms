import Joi from "joi";

export const jobSchema = Joi.object({
  positionTitle: Joi.string().required().min(3),
  positionCode: Joi.string().required(),
  description: Joi.string().required(),
  education: Joi.string().required(),
  experience: Joi.string().required(),
  trainings: Joi.string().required(),
  eligibility: Joi.string().required(),
  itemNumbers: Joi.array().items(Joi.string()).min(1).required(),
  salary: Joi.number().positive().required(),
  salaryGrade: Joi.number().integer().min(1).max(33).required(),
  placeOfAssignment: Joi.string().required(),
  category: Joi.string().valid(
    "permanent",
    "contractual",
    "coterminous",
    "casual",
  ),
  status: Joi.string().valid("draft", "published", "closed", "archived"),
});
