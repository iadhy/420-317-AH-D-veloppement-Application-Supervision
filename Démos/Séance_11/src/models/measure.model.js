import mongoose from "mongoose";

const measureSchema = new mongoose.Schema({
  sensor: {
    type: String,           // pas ObjectId : Sensor a un _id texte
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
