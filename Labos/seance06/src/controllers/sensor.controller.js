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
    const { id, name, unit, threshold, direction } = req.body;
    res.status(201).json(await service.create({ id, name, unit, threshold, direction }));
  } catch (error) {
    next(error);
  }
}

export async function replace(req, res, next) {
  try {
    const { name, unit, threshold, direction, active } = req.body;
    const updated = await service.replace(req.params.id, { name, unit, threshold, direction, active });
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
