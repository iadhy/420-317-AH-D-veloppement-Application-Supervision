import * as service from "../services/measure.service.js";

// Bornes physiques du capteur. Elles deviendront les contraintes du schema
// Mongoose a la seance 7.
const VALID_RANGE = { min: -10, max: 50 };

export function list(req, res, next) {
  try {
    // Tout ce qui vient de l'URL est du texte : la conversion est obligatoire.
    const min = req.query.min === undefined ? undefined : Number(req.query.min);
    res.status(200).json(service.list({ min }));
  } catch (error) {
    next(error);
  }
}

export function getLatest(req, res, next) {
  try {
    const measure = service.getLatest();
    if (!measure) {
      return res.status(404).json({ error: "Aucune mesure enregistree" });
    }
    res.status(200).json(measure);
  } catch (error) {
    next(error);
  }
}

export function getStats(req, res, next) {
  try {
    res.status(200).json(service.getStats());
  } catch (error) {
    next(error);
  }
}

export function create(req, res, next) {
  try {
    const { sensor, value } = req.body;

    if (typeof value !== "number") {
      return res.status(400).json({ error: "value doit etre un nombre" });
    }

    if (value < VALID_RANGE.min || value > VALID_RANGE.max) {
      return res.status(400).json({
        error: `value doit etre entre ${VALID_RANGE.min} et ${VALID_RANGE.max}`,
      });
    }

    res.status(201).json(service.add({ sensor: sensor ?? "temp-b127", value }));
  } catch (error) {
    next(error);
  }
}
