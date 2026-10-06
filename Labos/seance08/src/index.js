import "dotenv/config";
import app from "./app.js";
import { connectDatabase } from "./config/db.js";
import { Sensor } from "./sensor.js";
import { Monitor } from "./monitor.js";
import SensorModel from "./models/sensor.model.js";
import * as measureService from "./services/measure.service.js";

await connectDatabase();


const sensor = new Sensor("temp-b127", { min: 18, max: 32 });
sensor.on("measure", (measure) => measureService.add(measure));
sensor.start();

app.listen(process.env.PORT || 3000, () =>
  console.log(`http://localhost:${process.env.PORT || 3000}`),
);
