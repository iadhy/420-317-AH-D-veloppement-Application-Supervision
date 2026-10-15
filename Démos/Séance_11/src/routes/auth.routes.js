import { Router } from "express";
import * as controller from "../controllers/auth.controller.js";
import { validateRegister, validateLogin } from "../middlewares/auth.validator.js";

const router = Router();

// Les deux seules routes de l'API accessibles sans jeton.
router.post("/register", validateRegister, controller.register);
router.post("/login", validateLogin, controller.login);

export default router;
