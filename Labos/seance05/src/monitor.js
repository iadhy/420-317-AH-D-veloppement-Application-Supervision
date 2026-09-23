import { EventEmitter } from "events";

export class Monitor extends EventEmitter {
  constructor(rules) {
    super();
    this.rules = rules;
  }

  check(measure) {
    const rule = this.rules[measure.sensor];
    if (!rule) return;

    const exceeded =
      rule.direction === "above"
        ? measure.value > rule.threshold
        : measure.value < rule.threshold;

    if (exceeded) {
      this.emit("alert", { ...measure, threshold: rule.threshold, direction: rule.direction });
    }
  }
}
