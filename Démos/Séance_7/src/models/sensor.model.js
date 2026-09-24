import mongoose from "mongoose";

const sensorSchema = new mongoose.Schema({
  // _id choisi par l'utilisateur, pas genere par Mongo : cet identifiant
  // deviendra le nom du sujet MQTT auquel le serveur s'abonne (seance 14).
  _id: {
    type: String,
    required: true,
    match: /^[a-zA-Z0-9_-]+$/,
  },
  name: { type: String, required: true, trim: true },
  room: { type: String, trim: true },
  unit: { type: String, required: true, trim: true },
  min: { type: Number, required: true },
  max: { type: Number, required: true },
  threshold: { type: Number, required: true },
  direction: { type: String, required: true, enum: ["above", "below"] },
  active: { type: Boolean, default: true },
});

export default mongoose.model("Sensor", sensorSchema);
