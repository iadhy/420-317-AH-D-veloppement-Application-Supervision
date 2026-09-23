import * as service from "../services/measure.service.js";

export async function list(req, res, next) {
    try {
        const measures = await service.list();
        res.status(200).json(measures);
    } catch(error) {
        next(error);
    }
}

export async function getLatest(req, res, next) {
    try {
        const measure = await service.getLatest()
        if (!measure) {
            return res.status(404).json({error : "Aucune mesure enregistree"});
        }
        res.status(200).json(measure);
    } catch (error) {
        next(error);
    }
}

export async function getOne(req, res, next){
    try {
        const measure = await service.getById(req.params.id);
        if (!measure) {
            return res.status(404).json({error: "Mesure introuvable"})
;        }
        res.status(200).json(measure);
    } catch (error) {
        next(error)
    }
}


export async function getStats(req, res, next){
    try {
        const stats = await service.getStats();
        res.status(200).json(stats);
    } catch (error) {
        next(error)
    }
}