import { body } from "express-validator";
import { handleValidationErrors } from "./validationErrors.middleware.js";

export const validateSensorCreate = [
  body("id").trim().notEmpty().withMessage("L'ID est requis")
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage("L'ID ne peut contenir que des lettres, chiffres, tirets et underscores"),
  body("name").trim().notEmpty().withMessage("Le nom du capteur est requis"),
  body("unit").trim().notEmpty().withMessage("L'unite est requise"),
  body("min").isFloat().withMessage("min doit etre un nombre"),
  body("max").isFloat().withMessage("max doit etre un nombre"),
  body("threshold").isFloat().withMessage("Le seuil doit etre un nombre"),
  body("direction").isIn(["above", "below"]).withMessage("direction doit etre 'above' ou 'below'"),
  handleValidationErrors,
];

// PUT : id n'apparait pas -- il ne se modifie jamais apres la creation.
export const validateSensorUpdate = [
  body("name").optional().trim().notEmpty().withMessage("Le nom ne peut pas etre vide"),
  body("unit").optional().trim().notEmpty().withMessage("L'unite ne peut pas etre vide"),
  body("min").optional().isFloat().withMessage("min doit etre un nombre"),
  body("max").optional().isFloat().withMessage("max doit etre un nombre"),
  body("threshold").optional().isFloat().withMessage("Le seuil doit etre un nombre"),
  body("direction").optional().isIn(["above", "below"]).withMessage("direction doit etre 'above' ou 'below'"),
  body("active").optional().isBoolean().withMessage("active doit etre un booleen"),
  handleValidationErrors,
];
