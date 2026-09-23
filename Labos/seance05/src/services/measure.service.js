import { computeStats } from "../stats.js";

// Cette couche ignore HTTP : ni req, ni res.
// A la seance 7 elle passera a MongoDB, a la seance 14 elle sera appelee
// par MQTT au lieu d'Express. Dans les deux cas, sans changer d'interface.
const measures = [];

export function add({ sensor, value }) {
  const measure = { sensor, value, createdAt: new Date().toISOString() };
  measures.push(measure);
  return measure;
}

export function list({ min } = {}) {
  if (min === undefined) return measures;
  return measures.filter((measure) => measure.value > min);
}

export function getLatest() {
  return measures.at(-1) ?? null;
}

export function getStats() {
  return computeStats(measures);
}
