import mongoose from "mongoose";

const measureSchema = new mongoose.Schema({
  sensor: {
    // String, pas ObjectId : Sensor a maintenant un _id texte.
    type: String,
    ref: "Sensor",
    required: true,
    index: true,
  },
  value: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

export default mongoose.model("Measure", measureSchema);
