import { body } from "express-validator";
import { handleValidationErrors } from "./validationErrors.middleware.js";

// Le middleware s'execute AVANT le controleur : quand celui-ci demarre,
// les donnees sont deja saines.
export const validateSensorCreate = [
  body("id").trim().notEmpty()
    .withMessage("L'ID est requis")
    .matches(/^[a-zA-Z0-9_-]+$/)
    // Cet id devient le nom du sujet MQTT (seance 14) : seuls lettres,
    // chiffres, tirets et underscores y sont autorises.
    .withMessage("L'ID ne peut contenir que des lettres, chiffres, tirets et underscores"),
  body("name").trim().notEmpty()
    .withMessage("Le nom du capteur est requis"),
  body("unit").trim().notEmpty()
    .withMessage("L'unite est requise"),
  body("min").isFloat()
    .withMessage("Le minimum doit etre un nombre"),
  body("max").isFloat()
    .withMessage("Le maximum doit etre un nombre"),
  body("threshold").isFloat()
    .withMessage("Le seuil doit etre un nombre"),
  body("direction").isIn(["above", "below"])
    .withMessage("direction doit etre 'above' ou 'below'"),
  handleValidationErrors,
];

// PUT : id n'apparait pas ici -- l'identifiant ne se modifie jamais apres
// la creation (voir routes : id vient de l'URL, pas du corps).
// Tous les autres champs sont optionnels : on peut modifier seulement
// le seuil sans re-envoyer le reste.
export const validateSensorUpdate = [
  body("name").optional().trim().notEmpty()
    .withMessage("Le nom ne peut pas etre vide"),
  body("unit").optional().trim().notEmpty()
    .withMessage("L'unite ne peut pas etre vide"),
  body("min").isFloat()
    .withMessage("Le minimum doit etre un nombre"),
  body("max").isFloat()
    .withMessage("Le maximum doit etre un nombre"),
  body("threshold").optional().isFloat()
    .withMessage("Le seuil doit etre un nombre"),
  body("direction").optional().isIn(["above", "below"])
    .withMessage("direction doit etre 'above' ou 'below'"),
  body("active").optional().isBoolean()
    .withMessage("active doit etre un booleen"),
  handleValidationErrors,
];
