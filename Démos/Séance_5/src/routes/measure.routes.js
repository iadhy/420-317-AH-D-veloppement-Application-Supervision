import { Router } from "express";
import * as controller from "../controllers/measure.controller.js"

const router = Router();

router.get("/", controller.list);
router.get("/latest", controller.getLatest);
router.get("/boom", (req,res,next)=>{
    next(new Error("Panne simulee"));
})
export default router;