import { computeStats } from "../stats.js";

// Cette couche ignore HTTP : ni req, ni res.
// measures est une ressource EN LECTURE SEULE : aucune mesure n'est jamais
// creee par cette API. Elles arrivent par le capteur simule ou par MQTT
// (seance 14), directement dans ce service -- jamais par une route HTTP.
let nextId = 1;
const measures = [];

// add() n'est pas exposee par une route : elle est appelee par le capteur
// simule dans index.js, et le sera par l'acquisition MQTT a la seance 14.
export function add({ sensor, value }) {
  const measure = { id: String(nextId++), sensor, value, createdAt: new Date().toISOString() };
  measures.push(measure);
  return measure;
}

export function list({ min } = {}) {
  if (min === undefined) return measures;
  return measures.filter((measure) => measure.value > min);
}

export function getById(id) {
  return measures.find((measure) => measure.id === id) ?? null;
}

export function getLatest() {
  return measures.at(-1) ?? null;
}

export function getStats() {
  return computeStats(measures);
}
