import mongoose from "mongoose";

export async function connectDatabase() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error("MONGO_URI absent : verifiez votre fichier .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log("Connecte a MongoDB");
  } catch (error) {
    // Mieux vaut refuser de demarrer que servir un serveur a moitie mort.
    console.error("Connexion impossible :", error.message);
    process.exit(1);
  }
}
