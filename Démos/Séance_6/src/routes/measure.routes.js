import { Router } from "express";
import * as controller from "../controllers/measure.controller.js";

const router = Router();

router.get("/", controller.list);
router.get("/latest", controller.getLatest);
router.get("/stats", controller.getStats);
router.get("/:id", controller.getOne);

export default router;