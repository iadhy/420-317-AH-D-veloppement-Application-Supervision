import "dotenv/config";
import app from "./app.js";
import { connectDatabase } from "./config/db.js";
import { Sensor as SimulatedSensor } from "./sensor.js";
import { Monitor } from "./monitor.js";
import SensorModel from "./models/sensor.model.js";
import * as measureService from "./services/measure.service.js";

await connectDatabase();

// Depuis la seance 7, on ne cree plus le capteur automatiquement ici :
// c'est l'utilisateur qui le cree via POST /api/sensors. Si personne ne
// l'a fait, on le dit clairement plutot que de generer une fiche a sa place.
const SENSOR_ID = "temp-b127";
const sensorDocument = await SensorModel.findById(SENSOR_ID);

if (!sensorDocument) {
  console.warn(
    `Aucun capteur "${SENSOR_ID}" en base : creez-le via POST /api/sensors` +
    ` pour demarrer l'acquisition simulee.`,
  );
} else {
  // Le Monitor lit ses regles dans la base : le seuil vit avec le capteur.
  const monitor = new Monitor({
    [sensorDocument.id]: {
      threshold: sensorDocument.threshold,
      direction: sensorDocument.direction,
    },
  });

  monitor.on("alert", (measure) => {
    console.log(`   >>> SEUIL DEPASSE : ${measure.value} (seuil ${measure.threshold})`);
  });

  const simulated = new SimulatedSensor(sensorDocument.id, {
    min: sensorDocument.min,
    max: sensorDocument.max,
  });

  simulated.on("measure", async (measure) => {
    try {
      await measureService.add({ sensor: measure.sensor, value: measure.value });
      monitor.check(measure);
    } catch (error) {
      console.error("Enregistrement impossible :", error.message);
    }
  });

  simulated.start();
}

app.listen(process.env.PORT || 3000, () =>
  console.log(`http://localhost:${process.env.PORT || 3000}`),
);
