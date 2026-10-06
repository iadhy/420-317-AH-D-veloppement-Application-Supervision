import { validationResult } from "express-validator";

// Partage par tous les validateurs (sensor, measure) : un seul endroit
// qui decide du format de reponse en cas d'erreur de validation.
export function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg);
    return res.status(400).json({ errors: messages });
  }
  next();
}
