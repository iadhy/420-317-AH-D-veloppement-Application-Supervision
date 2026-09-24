import * as service from "../services/sensor.service.js";

export async function list(req, res, next) {
  try {
    res.status(200).json(await service.list());
  } catch (error) {
    next(error);
  }
}

export async function getOne(req, res, next) {
  try {
    const sensor = await service.getById(req.params.id);
    if (!sensor) {
      return res.status(404).json({ error: "Capteur introuvable" });
    }
    res.status(200).json(sensor);
  } catch (error) {
    next(error);
  }
}

export async function create(req, res, next) {
  try {
    // Extraction explicite : le client ne doit pas pouvoir ecrire "active"
    // ou tout autre champ non prevu (voir la demo : active: false impose).
    const { id, name, unit, min, max, threshold, direction } = req.body;
    res.status(201).json(await service.create({ id, name, unit, min, max, threshold, direction }));
  } catch (error) {
    // Un id deja utilise leve une erreur Mongo 11000, pas une exception
    // generique : le client a besoin d'un 409, pas d'un 500.
    if (error.code === 11000) {
      return res.status(409).json({ error: "Cet identifiant de capteur est deja utilise" });
    }
    next(error);
  }
}

export async function replace(req, res, next) {
  try {
    const { name, unit, min, max, threshold, direction, active } = req.body;
    const updated = await service.replace(req.params.id, { name, unit, min, max, threshold, direction, active });
    if (!updated) {
      return res.status(404).json({ error: "Capteur introuvable" });
    }
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
}

export async function remove(req, res, next) {
  try {
    if (!await service.remove(req.params.id)) {
      return res.status(404).json({ error: "Capteur introuvable" });
    }
    // 204 : pas de corps, donc end() et non json().
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}
