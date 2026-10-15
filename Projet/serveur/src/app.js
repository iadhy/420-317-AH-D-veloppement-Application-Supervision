import express from "express";
import helmet from "helmet";
import cors from "cors";
import { logger } from "./middlewares/logger.middleware.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { protect } from "./middlewares/auth.middleware.js";
import { loginLimiter } from "./middlewares/rateLimit.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import measureRoutes from "./routes/measure.routes.js";
import sensorRoutes from "./routes/sensor.routes.js";

const app = express();

// L'ordre de declaration est l'ordre d'execution.
app.use(logger);

// En-tetes de securite sur TOUTES les reponses, y compris les fichiers statiques.
app.use(helmet());

// Sans cette ligne, le navigateur n'autorise que la meme origine (c'est le cas
// du tableau de bord servi par ce serveur). Avec elle, on nomme UNE origine
// de confiance. Jamais cors() sans option : cela ouvre l'API a tout le monde.
// cors passe AVANT protect : une requete de pre-verification (OPTIONS) ne
// porte pas de jeton et serait refusee en 401 sinon.
if (process.env.CORS_ORIGIN) {
  app.use(cors({ origin: process.env.CORS_ORIGIN }));
}

// Corps limite a 10 ko : au-dela, 413 avant meme d'analyser le JSON.
app.use(express.json({ limit: "10kb" }));
app.use(express.static("src/public"));
// Chart.js est servi depuis node_modules : la politique de helmet refuse les CDN.
app.use("/vendor", express.static("node_modules/chart.js/dist"));

// Le limiteur est monte sur /login seulement, et AVANT le routeur d'auth.
app.use("/api/auth/login", loginLimiter);
app.use("/api/auth", authRoutes);

// protect au montage : aucune route de ces routeurs n'est publique.
app.use("/api/sensors", protect, sensorRoutes);
app.use("/api/measures", protect, measureRoutes);

// Apres les routeurs : tout ce qui n'a pas ete reconnu.
app.use((req, res) => {
  res.status(404).json({ error: "Ressource introuvable" });
});

// En tout dernier.
app.use(errorHandler);

export default app;
