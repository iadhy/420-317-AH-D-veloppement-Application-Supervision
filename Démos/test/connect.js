
import { MongoClient } from "mongodb";

const MONGO_URI = process.env.MONGO_URI;

const client = new MongoClient(MONGO_URI);

async function connect() {
    try {
        await client.connect();
        console.log("✅ Connexion réussie à MongoDB Atlas");
    } catch (err) {
        console.error("❌ Erreur de connexion :", err);
    } finally {
        await client.close();
    }
}

connect();
