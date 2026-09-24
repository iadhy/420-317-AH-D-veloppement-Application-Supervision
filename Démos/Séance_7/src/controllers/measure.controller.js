import * as service from "../services/measure.service.js";

export async function list(req, res, next) {
  try {
    const min = req.query.min === undefined ? undefined : Number(req.query.min);
    res.status(200).json(await service.list({ min }));
  } catch (error) {
    next(error);
  }
}

export async function getOne(req, res, next) {
  try {
    const measure = await service.getById(req.params.id);
    if (!measure) {
      return res.status(404).json({ error: "Mesure introuvable" });
    }
    res.status(200).json(measure);
  } catch (error) {
    next(error);
  }
}

export async function getLatest(req, res, next) {
  try {
    const measure = await service.getLatest();
    if (!measure) {
      return res.status(404).json({ error: "Aucune mesure enregistree" });
    }
    res.status(200).json(measure);
  } catch (error) {
    next(error);
  }
}

export async function getStats(req, res, next) {
  try {
    res.status(200).json(await service.getStats());
  } catch (error) {
    next(error);
  }
}
