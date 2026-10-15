import { body } from "express-validator";
import { handleValidationErrors } from "./validationErrors.middleware.js";

// Pas de champ "role" ici, et le controleur ne le lit jamais : on ne
// laisse pas le client choisir son propre role.
export const validateRegister = [
  body("email").trim().isEmail().withMessage("Courriel invalide"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Le mot de passe doit contenir au moins 8 caracteres"),
  handleValidationErrors,
];

// A la connexion on ne juge pas la FORME du mot de passe : on verifie
// seulement qu'il est present. C'est la comparaison qui tranche.
export const validateLogin = [
  body("email").trim().notEmpty().withMessage("Le courriel est requis"),
  body("password").notEmpty().withMessage("Le mot de passe est requis"),
  handleValidationErrors,
];
