import * as measureService from "./measure.service.js";
import * as sensorService from "./sensor.service.js";
import { Monitor } from "../monitor.js";
import { emit } from "../realtime.js";

// Le moniteur annonce, le serveur diffuse : les deux ne se connaissent pas.
export const monitor = new Monitor();
monitor.on("alert", (alert) => emit("alert", alert));
monitor.on("recovery", (recovery) => emit("recovery", recovery));

/**
 * Point d'entree UNIQUE de toute mesure, d'ou qu'elle vienne.
 * Appelants : le capteur simule (SIMULATE_SENSOR=true) et, dans le projet, les
 * messages MQTT recus par src/mqtt.js (LIEN MQTT 4). Seul l'appelant change,
 * jamais cette fonction : c'est pourquoi elle n'a rien a changer pour MQTT.
 */
export async function ingest({ sensor: sensorId, value }) {
  // 1. Toujours enregistrer, meme si le capteur est desactive ou inconnu :
  //    l'historique ne se perd pas.
  const measure = await measureService.add({ sensor: sensorId, value });

  // 2. Un capteur inconnu ou desactive n'est ni diffuse ni surveille.
  const sensor = await sensorService.getById(sensorId);
  if (!sensor?.active) return measure;

  // 3. On diffuse ce qui est REELLEMENT en base (avec son createdAt), puis on surveille.
  emit("measure", measure);
  monitor.check(measure, sensor);

  return measure;
}
