import { Router } from "express";
import * as controller from "../controllers/sensor.controller.js";
import { validateSensorCreate, validateSensorUpdate } from "../middlewares/sensor.validator.js";

const router = Router();

// CRUD complet : c'est la seule ressource ou une personne cree quelque
// chose via l'API (voir measures : lecture seule).
router.get("/", controller.list);
router.get("/:id", controller.getOne);
router.post("/", validateSensorCreate, controller.create);
router.put("/:id", validateSensorUpdate, controller.replace);
router.delete("/:id", controller.remove);

export default router;
