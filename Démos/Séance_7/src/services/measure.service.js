import Measure from "../models/measure.model.js";
import { computeStats } from "../stats.js";

// Cette couche ignore HTTP : ni req, ni res.
// measures reste en LECTURE SEULE : aucune mesure n'est jamais creee par
// cette API. Elles arrivent par le capteur simule ou par MQTT (seance 14),
// directement dans ce service -- jamais par une route HTTP.

// add() n'est pas exposee par une route : appelee par le capteur simule
// dans index.js, et le sera par l'acquisition MQTT a la seance 14.
export async function add({ sensor, value }) {
  return Measure.create({ sensor, value });
}

export async function list({ min } = {}) {
  const filter = {};
  if (min !== undefined) filter.value = { $gte: min };

  return Measure.find(filter).sort({ createdAt: -1 }).populate("sensor", "name unit");
}

export async function getById(id) {
  return Measure.findById(id).populate("sensor", "name unit");
}

export async function getLatest() {
  return Measure.findOne().sort({ createdAt: -1 }).populate("sensor", "name unit");
}

export async function getStats() {
  const measures = await Measure.find();
  return computeStats(measures);
}
