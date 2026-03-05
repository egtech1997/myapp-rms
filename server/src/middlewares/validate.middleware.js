import AppError from "../utils/AppError.js";

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const errorMessage = error.details.map((el) => el.message).join(", ");
    return next(new AppError(errorMessage, 400));
  }

  next();
};

export default validate;
