import "dotenv/config";
import mongoose from "mongoose";
import Sensor from "../models/sensor.model.js";
import Measure from "../models/measure.model.js";

/**
 * Insere 10 000 mesures pour un capteur existant, avec des horodatages
 * realistes espaces de 2 secondes (comme le ferait le capteur simule),
 * remontant dans le passe depuis maintenant.
 *
 * Necessite une connexion a MongoDB : ce n'est PAS un test hors ligne,
 * contrairement a schema.test.js et query.test.js.
 *
 * Usage :
 *   AJOUER "seed": "node src/tests/seed.js" à votre package.json.
 *   npm run seed                  -- capteur par defaut (temp-b127)
 *   npm run seed -- capteur-02    -- un autre capteur, deja cree
 */

const SENSOR_ID = process.argv[2] || "temp-b127";
const NOMBRE_DE_MESURES = 10_000;
const INTERVALLE_MS = 2000; // meme cadence que le capteur simule

function genererMesures(sensorId, nombre) {
  const maintenant = Date.now();
  const mesures = [];

  for (let i = 0; i < nombre; i += 1) {
    mesures.push({
      sensor: sensorId,
      value: Number((18 + Math.random() * 14).toFixed(1)), // 18 a 32, comme Sensor
      // La plus recente (i = 0) est "maintenant" ; les suivantes remontent
      // dans le temps de 2 secondes chacune, comme un vrai historique.
      createdAt: new Date(maintenant - i * INTERVALLE_MS),
    });
  }

  return mesures;
}

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI absent : verifiez votre fichier .env");
    process.exit(1);
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  console.log("Connecte a MongoDB");

  const sensor = await Sensor.findById(SENSOR_ID);
  if (!sensor) {
    console.error(
      `Aucun capteur "${SENSOR_ID}" en base. Creez-le d'abord via POST /api/sensors,` +
      ` ou passez un autre id : npm run seed -- votre-id`,
    );
    process.exit(1);
  }

  console.log(`Generation de ${NOMBRE_DE_MESURES} mesures pour "${SENSOR_ID}"...`);
  const mesures = genererMesures(SENSOR_ID, NOMBRE_DE_MESURES);

  const debut = Date.now();
  await Measure.insertMany(mesures, { ordered: false });
  const duree = ((Date.now() - debut) / 1000).toFixed(1);

  const total = await Measure.countDocuments({ sensor: SENSOR_ID });
  console.log(`${NOMBRE_DE_MESURES} mesures inserees en ${duree}s.`);
  console.log(`Total pour "${SENSOR_ID}" en base : ${total}`);

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error("Echec de l'insertion :", error.message);
  process.exit(1);
});