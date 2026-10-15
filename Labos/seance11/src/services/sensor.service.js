import Sensor from "../models/sensor.model.js";

export async function create({ id, name, room, unit, min, max, threshold, direction }) {
  return Sensor.create({ _id: id, name, room, unit, min, max, threshold, direction });
}

export async function list() {
  return Sensor.find();
}

export async function getById(id) {
  return Sensor.findById(id);
}

export async function replace(id, { name, room, unit, min, max, threshold, direction, active }) {
  return Sensor.findByIdAndUpdate(
    id,
    { name, room, unit, min, max, threshold, direction, active },
    { new: true, runValidators: true },
  );
}

export async function remove(id) {
  const deleted = await Sensor.findByIdAndDelete(id);
  return deleted !== null;
}
