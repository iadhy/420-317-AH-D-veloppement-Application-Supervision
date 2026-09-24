import app from "./app.js";
import { Sensor } from "./sensor.js";
import * as measureService from "./services/measure.service.js";

// Le capteur simule alimente le service directement -- pas de route HTTP.
// A la seance 14, l'acquisition MQTT fera exactement la meme chose.
const sensor = new Sensor("temp-b127", { min: 18, max: 32 });
sensor.on("measure", (measure) => measureService.add(measure));
sensor.start();

app.listen(3000, () => console.log("http://localhost:3000"));
