import Joi from "joi";

// Logic for defining the Schema
export const roleValidator = {
  createOrUpdate: (data) => {
    const schema = Joi.object({
      name: Joi.string().min(3).max(30).trim().lowercase().required().messages({
        "string.min": "Role name must be at least 3 characters long.",
        "string.empty": "Role name cannot be empty.",
        "any.required": "Role name is required.",
      }),
      permissions: Joi.array().items(Joi.string().trim()).default([]),
    });

    return schema.validate(data, { abortEarly: false });
  },
};

// The Middleware function that your routes import as { validate }
export const validate = (validatorFn) => {
  return (req, res, next) => {
    const { error, value } = validatorFn(req.body);

    if (error) {
      return res.status(400).json({
        status: "fail",
        message: "Validation failed",
        errors: error.details.map((el) => el.message),
      });
    }

    // Replace req.body with the sanitized/validated value (handles defaults)
    req.body = value;
    next();
  };
};
