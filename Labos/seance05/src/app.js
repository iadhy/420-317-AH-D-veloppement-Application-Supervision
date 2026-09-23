import express from "express";
import { logger } from "./middlewares/logger.middleware.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import measureRoutes from "./routes/measure.routes.js";

const app = express();

// L'ordre de declaration est l'ordre d'execution.
app.use(logger);
app.use(express.json());
app.use(express.static("src/public"));

app.use("/api/measures", measureRoutes);

// Apres les routeurs : tout ce qui n'a pas ete reconnu.
app.use((req, res) => {
  res.status(404).json({ error: "Ressource introuvable" });
});

// En tout dernier.
app.use(errorHandler);

export default app;
