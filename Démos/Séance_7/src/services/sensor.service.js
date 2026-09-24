import Sensor from "../models/sensor.model.js";

// Cette couche ignore HTTP : ni req, ni res.
// sensors garde le CRUD complet : c'est le tableau de bord qui cree un
// capteur pour commencer a ecouter le bon sujet MQTT (seance 14).

export async function create({ id, name, unit, min, max, threshold, direction }) {
  // _id vient du client : c'est le nom du sujet MQTT auquel on s'abonnera.
  return Sensor.create({ _id: id, name, unit, min, max, threshold, direction });
}

export async function list() {
  return Sensor.find();
}

export async function getById(id) {
  return Sensor.findById(id);
}

export async function replace(id, { name, unit, min, max, threshold, direction, active }) {
  // new: true renvoie le document A JOUR. runValidators applique les
  // contraintes du schema (dont l'enum de direction) a la mise a jour.
  return Sensor.findByIdAndUpdate(
    id,
    { name, unit, min, max, threshold, direction, active },
    { new: true, runValidators: true },
  );
}

export async function remove(id) {
  const deleted = await Sensor.findByIdAndDelete(id);
  return deleted !== null;
}
