import { EventEmitter } from "events";

/**
 * Le moniteur decide ce qui est une alerte.
 *
 * Cette responsabilite n'appartient PAS au capteur : une sonde renvoie 29.3,
 * elle ignore si c'est normal ou grave. Le meme 29.3 est banal dans un atelier
 * et critique dans une salle de serveurs.
 *
 * Le seuil est une donnee de supervision, stockee avec la description du
 * capteur (seance 7). A la seance 14, l'ESP32 publiera { value } et rien de
 * plus : ce fichier continuera de fonctionner sans modification.
 */
export class Monitor extends EventEmitter {
  constructor(rules) {
    super();
    this.rules = rules;
  }

  check(measure) {
    const rule = this.rules[measure.sensor];
    if (!rule) return;

    // Une temperature alerte en montant, une tension en descendant.
    const exceeded =
      rule.direction === "above"
        ? measure.value > rule.threshold
        : measure.value < rule.threshold;

    if (exceeded) {
      this.emit("alert", { ...measure, threshold: rule.threshold, direction: rule.direction });
    }
  }
}
