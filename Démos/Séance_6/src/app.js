import express from "express";
import { logger } from "./middlewares/logger.middleware.js";
import measureRoutes from "./routes/measure.routes.js"
import { errorHandler } from "./middlewares/error.middlerware.js";
import sensorRoutes from "./routes/sensor.routes.js";

const app = express();
app.use(logger);
app.use(express.json());
app.use(express.static("src/public"))
app.use("/api/measures", measureRoutes)
app.use("/api/sensors", sensorRoutes)

app.use((req, res) => {
    res.status(404).json({error: "Ressource introuvable"});
});

app.use(errorHandler);

export default app;