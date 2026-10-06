import { Router } from "express";
import * as controller from "../controllers/measure.controller.js";
import { validateMeasureId } from "../middlewares/measure.validator.js";

const router = Router();

// Ressource EN LECTURE SEULE : quatre GET, rien d'autre. Aucune route
// POST/PUT/DELETE : personne ne cree de mesure a travers l'API.
//
// Routes fixes avant la route a parametre, sinon /latest et /stats
// seraient captures par /:id.
router.get("/", controller.list);
router.get("/latest", controller.getLatest);
router.get("/stats", controller.getStats);
router.get("/:id", validateMeasureId, controller.getOne);

export default router;
