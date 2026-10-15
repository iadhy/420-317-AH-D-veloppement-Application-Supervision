import { Router } from "express";
import * as controller from "../controllers/sensor.controller.js";
import { validateSensorCreate, validateSensorUpdate } from "../middlewares/sensor.validator.js";
import { authorize } from "../middlewares/auth.middleware.js";

const router = Router();

// protect est applique au montage (app.js) : ici, tout le monde est deja
// identifie. Reste a decider QUI a le droit de faire QUOI.
//
// authorize() passe AVANT le validateur : un reader qui envoie un corps
// invalide recoit 403, pas 400. On ne lui explique pas un formulaire
// qu'il n'a de toute facon pas le droit de soumettre.

// Consulter : tous les roles.
router.get("/", controller.list);
router.get("/:id", controller.getOne);

// Creer et modifier (y compris activer/desactiver) : operator et admin.
router.post("/", authorize("operator", "admin"), validateSensorCreate, controller.create);
router.put("/:id", authorize("operator", "admin"), validateSensorUpdate, controller.replace);

// Supprimer : admin seulement.
router.delete("/:id", authorize("admin"), controller.remove);

export default router;
