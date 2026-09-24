import { param } from "express-validator";
import { handleValidationErrors } from "./validationErrors.middleware.js";

// measures est en lecture seule : on ne valide donc que l'identifiant
// dans l'URL, jamais de corps de requete.
//
// isMongoId() fait exactement ce que faisait notre middleware
// validateObjectId maison, avec mongoose.Types.ObjectId.isValid() --
// verifie, plutot que reecrit a la main.
export const validateMeasureId = [
  param("id").isMongoId().withMessage("Identifiant invalide"),
  handleValidationErrors,
];
