import AppError from "../utils/AppError.js";

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });

  if (error) {
    const errorMessage = error.details.map((el) => el.message).join(", ");
    return next(new AppError(errorMessage, 400));
  }

  req.body = value;
  next();
};

export default validate;
