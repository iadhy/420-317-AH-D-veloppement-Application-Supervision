import app from "./app.js";
import { Sensor } from "./sensor.js";
import * as measureService from "./services/measure.service.js";

const sensor = new Sensor("temp-b127", { min: 18, max: 32 });
sensor.on("measure", (measure) => measureService.add(measure));
sensor.start();

app.listen(3000, () => console.log("http://localhost:3000"));
