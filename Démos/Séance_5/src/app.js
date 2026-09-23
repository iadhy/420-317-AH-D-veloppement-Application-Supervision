import express from "express";
import { logger } from "./middlewares/logger.middleware.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import measureRoutes from "./routes/measure.routes.js"

const app = express();
app.use(express.json());
app.use(logger);
app.use(express.static("src/public"));
app.use("/api/measures", measureRoutes);
app.use((req,res)=>{
  res.status(404).json({error: "Ressource introuvable"});
});
app.use(errorHandler);

export default app;