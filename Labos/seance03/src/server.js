import http from "http";
import { readFile } from "fs/promises";
import { Sensor } from "./sensor.js";
import { computeStats } from "./stats.js";
import { sendJson } from "./sendJson.js";

const PORT = 3000;

const SENSOR_CONFIG = { min: 18, max: 32 };

const measures = [];
const sensor = new Sensor("temp-b127", SENSOR_CONFIG);
sensor.on("measure", (measure) => measures.push(measure));
sensor.start();

const CONTENT_TYPES = { ".html": "text/html", ".css": "text/css" };

async function sendFile(res, fileName, extension) {
  try {
    const content = await readFile(`src/public/${fileName}`, "utf-8");
    res.writeHead(200, { "Content-Type": CONTENT_TYPES[extension] });
    res.end(content);
  } catch {
    sendJson(res, 404, { error: "Fichier introuvable" });
  }
}

function handlePost(req, res) {
  let body = "";

  req.on("data", (chunk) => {
    body += chunk;
  });

  req.on("end", () => {
    try {
      const received = JSON.parse(body);

      if (typeof received.value !== "number") {
        return sendJson(res, 400, { error: "value doit etre un nombre" });
      }

      if (received.value < SENSOR_CONFIG.min || received.value > SENSOR_CONFIG.max) {
        return sendJson(res, 400, {
          error: `value doit etre entre ${SENSOR_CONFIG.min} et ${SENSOR_CONFIG.max}`,
        });
      }

      // On n'utilise que les champs attendus, et la date vient du serveur.
      // On ne garde que les champs attendus, et la date vient du serveur :
      // le client ne doit pas pouvoir inventer un horodatage.
      const measure = {
        sensor: received.sensor ?? sensor.id,
        value: received.value,
        createdAt: new Date().toISOString(),
      };

      measures.push(measure);
      sendJson(res, 201, measure);
    } catch {
      sendJson(res, 400, { error: "JSON malforme" });
    }
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "GET" && url.pathname === "/") {
    return sendFile(res, "index.html", ".html");
  }

  if (req.method === "GET" && url.pathname === "/style.css") {
    return sendFile(res, "style.css", ".css");
  }

  if (req.method === "GET" && url.pathname === "/api/measures") {
    const min = url.searchParams.get("min");
    // Sans Number(), la comparaison porte sur du texte et renvoie n'importe quoi.
    const result = min === null ? measures : measures.filter((m) => m.value > Number(min));
    return sendJson(res, 200, result);
  }

  if (req.method === "GET" && url.pathname === "/api/measures/latest") {
    if (measures.length === 0) {
      return sendJson(res, 404, { error: "Aucune mesure enregistree" });
    }
    return sendJson(res, 200, measures.at(-1));
  }

  if (req.method === "GET" && url.pathname === "/api/measures/stats") {
    return sendJson(res, 200, computeStats(measures));
  }

  if (req.method === "POST" && url.pathname === "/api/measures") {
    return handlePost(req, res);
  }

  sendJson(res, 404, { error: "Ressource introuvable" });
});

server.listen(PORT, () => console.log(`http://localhost:${PORT}`));
