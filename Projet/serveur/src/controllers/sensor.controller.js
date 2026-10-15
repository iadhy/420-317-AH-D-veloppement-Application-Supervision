import * as service from "../services/sensor.service.js";
import * as realtime from "../realtime.js";

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
    const { id, name, room, unit, min, max, threshold, direction } = req.body;
    const sensor = await service.create({ id, name, room, unit, min, max, threshold, direction });
    realtime.emit("sensor:created", sensor);

    // -----------------------------------------------------------------------
    // LIEN MQTT 2 : un capteur vient d'etre cree (projet)
    //
    // Le serveur doit maintenant ecouter son sujet, sans redemarrage.
    // Appelez subscribeSensor(sensor._id) (a importer depuis ../mqtt.js). Un seul argument :
    // l'identifiant du capteur cree. La fonction ne retourne rien, inutile d'attendre.
    // -----------------------------------------------------------------------

    res.status(201).json(sensor);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: "Cet identifiant de capteur est deja utilise" });
    }
    next(error);
  }
}

export async function replace(req, res, next) {
  try {
    const { name, room, unit, min, max, threshold, direction, active } = req.body;
    const updated = await service.replace(req.params.id, { name, room, unit, min, max, threshold, direction, active });
    if (!updated) {
      return res.status(404).json({ error: "Capteur introuvable" });
    }
    realtime.emit("sensor:updated", updated);

    // LIEN MQTT : aucun ici, et c'est voulu. Desactiver un capteur (active: false)
    // ne change PAS l'ecoute : ses mesures continuent d'etre enregistrees, seule
    // la diffusion s'arrete (c'est ingest() qui le decide). L'identifiant ne se
    // modifie jamais, donc le sujet non plus.
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
}

export async function remove(req, res, next) {
  try {
    if (!(await service.remove(req.params.id))) {
      return res.status(404).json({ error: "Capteur introuvable" });
    }
    realtime.emit("sensor:deleted", { id: req.params.id });

    // -----------------------------------------------------------------------
    // LIEN MQTT 3 : un capteur vient d'etre supprime (projet)
    //
    // Le serveur doit cesser d'ecouter son sujet : plus aucune mesure ne doit etre
    // enregistree pour lui. Appelez unsubscribeSensor(req.params.id) : un seul argument,
    // l'identifiant du capteur supprime, et rien a attendre.
    // -----------------------------------------------------------------------

    res.status(204).end();
  } catch (error) {
    next(error);
  }
}
