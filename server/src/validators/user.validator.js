import Joi from "joi";

export const userValidator = {
  toggleStatus: (data) => {
    const schema = Joi.object({
      isActive: Joi.boolean().required().messages({
        "any.required": "The isActive status is required.",
        "boolean.base": "The isActive status must be a true or false value.",
      }),
    });

    return schema.validate(data, { abortEarly: false });
  },
};
