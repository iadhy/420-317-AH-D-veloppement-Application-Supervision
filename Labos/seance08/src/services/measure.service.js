import Measure from "../models/measure.model.js";
import { buildFilter, buildSort } from "../utils/query.js";

// measures est EN LECTURE SEULE : aucune mesure n'est creee par une route
// HTTP. add() reste exportee car le capteur simule (et plus tard MQTT,
// seance 14) l'appelle directement depuis index.js -- jamais via un
// controleur. Il n'y a donc pas de replace() ni de remove() : ces routes
// n'existent pas.

export async function add({ sensor, value }) {
  return Measure.create({ sensor, value });
}

export async function list(query = {}) {
  const filter = buildFilter(query);
  const sort = buildSort(query);

  return Measure.find(filter).sort(sort).populate("sensor", "name unit");
}

export async function getById(id) {
  return Measure.findById(id).populate("sensor", "name unit");
}

export async function getLatest() {
  return Measure.findOne().sort({ createdAt: -1 }).populate("sensor", "name unit");
}

export async function getStats() {
  const [stats] = await Measure.aggregate([
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        min: { $min: "$value" },
        max: { $max: "$value" },
        average: { $avg: "$value" },
      },
    },
  ]);

  if (!stats) return { count: 0, min: null, max: null, average: null };

  return {
    count: stats.count,
    min: stats.min,
    max: stats.max,
    average: Number(stats.average.toFixed(2)),
  };
}
