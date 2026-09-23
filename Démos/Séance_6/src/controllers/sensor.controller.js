import * as service from "../services/sensor.services.js";

export async function create(req, res, next) {
    try {
        const {id, name, unit, threshold, direction} = req.body;
        const sensor = service.create({id, name, unit, threshold, direction});
        res.status(201).json(sensor);
    } catch (error) {
        next(error);
    }
}