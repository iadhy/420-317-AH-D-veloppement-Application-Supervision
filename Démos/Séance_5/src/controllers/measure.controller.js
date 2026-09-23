import * as service from "../services/measure.service.js"

export function list(req, res, next){
    try {
        res.status(200).json(service.list());
    } catch (error) {
        next(error);
    }
}

export function getLatest(req, res, next){
    try {
        const measure = service.getLatest();
        if(!measure) {
            return res.status(404).json({error: "Aucune mesure enregistrée"});
        }
        res.status(200).json(measure);
    } catch (error) {
        next(error);
    }
}