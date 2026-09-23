import { Router } from "express";
import * as controller from "../controllers/measure.controller.js";

const router = Router();

// Le prefixe /api/measures est declare une seule fois, dans app.js
router.get("/", controller.list);
router.get("/latest", controller.getLatest);
router.get("/stats", controller.getStats);
router.post("/", controller.create);

export default router;
