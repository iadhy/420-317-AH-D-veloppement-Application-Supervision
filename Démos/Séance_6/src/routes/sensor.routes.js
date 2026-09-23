import { Router } from "express";
import * as controller from "../controllers/sensor.controller.js";
import { validateSensor } from "../validators/sensor.validator.js";

const router = Router();

router.post("/", validateSensor, controller.create);

export default router;