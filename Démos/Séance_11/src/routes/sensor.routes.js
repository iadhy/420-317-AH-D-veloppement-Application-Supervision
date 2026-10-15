import { Router } from "express";
import * as controller from "../controllers/sensor.controller.js";
import { validateSensorCreate, validateSensorUpdate } from "../middlewares/sensor.validator.js";
import { authorize } from "../middlewares/auth.middleware.js";

const router = Router();

// protect est applique au montage (app.js) : ici, tout le monde est deja
// identifie. Seule la suppression exige un role precis, pour la demo.
// Au laboratoire, vous decidez qui peut creer et modifier.
router.get("/", controller.list);
router.get("/:id", controller.getOne);
router.post("/", validateSensorCreate, controller.create);
router.put("/:id", validateSensorUpdate, controller.replace);
router.delete("/:id", authorize("admin"), controller.remove);

export default router;
