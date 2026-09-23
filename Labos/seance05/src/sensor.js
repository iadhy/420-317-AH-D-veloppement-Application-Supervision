import { EventEmitter } from "events";

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
