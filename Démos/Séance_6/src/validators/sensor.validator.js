import { body, validationResult } from "express-validator";

export const validateSensor = [
    body("id").trim().notEmpty().withMessage("ID est requis"),
    body("name").trim().notEmpty().withMessage("Le nom est requis"),
    body("unit").trim().notEmpty().withMessage("L'unité est requise"),
    body("threshold").isFloat().withMessage("Le seuil doit être un nombre"),
    body("direction").isIn(["above","below"]).withMessage("Direction doit être above ou below"),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const messages = errors.array().map((e)=> e.msg);
            return res.status(400).json({ errors: messages})
        }
        next();
    },
];