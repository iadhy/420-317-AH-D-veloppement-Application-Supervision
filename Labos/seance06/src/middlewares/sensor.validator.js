import { body, validationResult } from "express-validator";

function  handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }

// Le middleware s'execute AVANT le controleur : quand celui-ci demarre,
// les donnees sont deja saines.
// POST : active n'existe pas dans les regles -> ignore silencieusement
// si le client l'envoie quand meme (le controleur ne le lira pas non plus)
export const validateSensorCreate = [
  body("id").trim().notEmpty()
    .withMessage("L'ID est requis"),
  body("name").trim().notEmpty()
    .withMessage("Le nom du capteur est requis"),
  body("unit").trim().notEmpty()
    .withMessage("L'unite est requise"),
  body("threshold").isFloat()
    .withMessage("Le seuil doit etre un nombre"),
  body("direction").isIn(["above", "below"])
    .withMessage("direction doit etre 'above' ou 'below'"),
  handleValidationErrors,
];

// PUT : active devient modifiable, mais reste optionnel (on peut modifier
// seulement le seuil sans re-envoyer active a chaque fois)
export const validateSensorUpdate = [
  body("name").trim().notEmpty().withMessage("Le nom ne peut pas etre vide"),
  body("unit").trim().notEmpty().withMessage("L'unite ne peut pas etre vide"),
  body("threshold").isFloat().withMessage("Le seuil doit etre un nombre"),
  body("direction").isIn(["above", "below"]).withMessage("direction doit etre 'above' ou 'below'"),
  body("active").isBoolean().withMessage("active doit etre un booleen"),
  handleValidationErrors,
];