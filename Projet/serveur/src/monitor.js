import { EventEmitter } from "events";

/**
 * Le moniteur decide ce qui est une alerte.
 *
 * Cette responsabilite n'appartient PAS au capteur : une sonde renvoie 29.3,
 * elle ignore si c'est normal ou grave. Le meme 29.3 est banal dans un atelier
 * et critique dans une salle de serveurs.
 *
 * Il n'emet qu'aux CHANGEMENTS d'etat :
 *   - "alert"    : la mesure vient de depasser le seuil
 *   - "recovery" : la mesure vient de revenir dans la normale
 * Dix mesures consecutives au-dessus du seuil ne produisent qu'une seule alerte.
 *
 * Le seuil et la direction viennent de la description du capteur (seance 7),
 * lue en base a chaque mesure : modifier un seuil par l'API prend effet
 * immediatement. Ce fichier ne change pas quand le capteur simule est
 * remplace par un ESP32 (seance 14).
 */
export class Monitor extends EventEmitter {
  constructor() {
    super();
    // capteur -> true s'il est actuellement en alerte
    this.inAlert = new Map();
  }

  check(measure, sensor) {
    // Une temperature alerte en montant, une tension en descendant.
    const exceeded =
      sensor.direction === "above"
        ? measure.value > sensor.threshold
        : measure.value < sensor.threshold;

    const wasInAlert = this.inAlert.get(measure.sensor) ?? false;
    if (exceeded === wasInAlert) return;

    this.inAlert.set(measure.sensor, exceeded);

    this.emit(exceeded ? "alert" : "recovery", {
      sensor: measure.sensor,
      value: measure.value,
      threshold: sensor.threshold,
      direction: sensor.direction,
      createdAt: measure.createdAt,
    });
  }
}
