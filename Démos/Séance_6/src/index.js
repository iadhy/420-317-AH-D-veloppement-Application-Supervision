import { Sensor } from "./sensor.js";
import * as measureService from "./services/measure.service.js"
import app from "./app.js";

const sensor = new Sensor("tmp-1227", {min: 18, max:32 });
sensor.on("measure", (measure) => measureService.add(measure));
sensor.start();

app.listen(3000, () => console.log("http://localhost:3000"));