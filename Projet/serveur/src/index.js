import "dotenv/config";
import http from "http";
import app from "./app.js";
import { connectDatabase } from "./config/db.js";
import { Sensor } from "./sensor.js";
import { initRealtime } from "./realtime.js";
import { ingest } from "./services/acquisition.service.js";

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET absent : verifiez votre fichier .env");
  process.exit(1);
}

await connectDatabase();

// SOCKET.IO : DEJA BRANCHE, rien a faire ici. C'est lui qui diffuse les mesures, les alertes
// et les changements de capteurs aux navigateurs. Le projet ne porte que sur MQTT.
//
// Socket.IO s'attache a un serveur HTTP, pas a app : on le cree nous-memes.
// Appeler app.listen() ici creerait un SECOND serveur, sans Socket.IO.
const server = http.createServer(app);
initRealtime(server);

// Le capteur simule ne sert plus qu'a essayer le tableau de bord sans carte :
// SIMULATE_SENSOR=true dans .env. Avec une vraie carte (MQTT), laissez-le eteint,
// sinon deux sources alimentent le meme capteur.
if (process.env.SIMULATE_SENSOR === "true") {
  const sensor = new Sensor("temp-b127", { min: 18, max: 32 });

  // Une erreur dans une fonction async appelee par un evenement ne remonte nulle
  // part : sans catch, une panne de base arreterait tout le processus.
  sensor.on("measure", (measure) => {
    ingest(measure).catch((error) => console.error("Mesure perdue :", error.message));
  });
  sensor.start();
}

const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`http://localhost:${port}`));

// ---------------------------------------------------------------------------
// LIEN MQTT 1 : demarrer la passerelle (projet)
//
// Une fois la base connectee, appelez startMqtt() (a importer depuis ./mqtt.js, sans argument).
// Inutile d'attendre son resultat ni de le garder : elle ne retourne rien dont vous ayez besoin ici.
// Elle doit venir APRES connectDatabase() : au demarrage, elle lit la liste des
// capteurs pour s'abonner a leurs sujets.
// ---------------------------------------------------------------------------
