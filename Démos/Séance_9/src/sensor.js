import { EventEmitter } from "events";

/**
 * Un capteur simule.
 *
 * Il ne fait qu'une chose : produire une valeur et l'annoncer. Il ne connait
 * ni seuil, ni alerte, ni destinataire -- exactement comme un capteur reel.
 * A la seance 14, un ESP32 le remplacera en publiant le meme format.
 */
export class Sensor extends EventEmitter {
  constructor(id, { min, max }) {
    super();
    this.id = id;
    this.min = min;
    this.max = max;
    this.timer = null;
  }

  read() {
    const value = this.min + Math.random() * (this.max - this.min);
    return Number(value.toFixed(1));
  }

  start(intervalMs = 2000) {
    if (this.timer) return;

    this.timer = setInterval(() => {
      // Format fixe a la seance 1 : une valeur, un instant, un capteur.
      this.emit("measure", {
        sensor: this.id,
        value: this.read(),
        createdAt: new Date().toISOString(),
      });
    }, intervalMs);
  }

  stop() {
    clearInterval(this.timer);
    this.timer = null;
  }
}
