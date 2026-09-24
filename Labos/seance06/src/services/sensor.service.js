// Cette couche ignore HTTP : ni req, ni res.
// sensors a besoin du CRUD complet : c'est le tableau de bord qui cree un
// capteur pour commencer a ecouter le bon sujet MQTT (seance 14).
const sensors = [];

export function create({ id, name, unit, threshold, direction }) {
  // id et active sont poses ICI, avant tout etalement de donnees recues :
  // le service reste la seule source de verite sur ces deux champs.
  const sensor = {
    id,
    name,
    unit,
    threshold,
    direction,
    active: true,
  };
  sensors.push(sensor);
  return sensor;
}

export function list() {
  return sensors;
}

export function getById(id) {
  return sensors.find((sensor) => sensor.id === id) ?? null;
}

export function replace(id, { name, unit, threshold, direction , active}) {
  const index = sensors.findIndex((sensor) => sensor.id === id);
  if (index === -1) return null;

  sensors[index] = { ...sensors[index], name, unit, threshold, direction, active};
  return sensors[index];
}

export function remove(id) {
  const index = sensors.findIndex((sensor) => sensor.id === id);
  if (index === -1) return false;

  sensors.splice(index, 1);
  return true;
}
