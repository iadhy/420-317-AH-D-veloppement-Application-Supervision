import app from "./app.js";
import * as measureService from "./services/measure.service.js";
import {Sensor} from "./sensor.js"

const sensor = new Sensor("tmp-127",{min: 18, max: 32});
sensor.on("measure", (measure) => measureService.add(measure));
sensor.start();


app.listen(3000, () => console.log("http://localhost:3000"));