
import { MongoClient } from "mongodb";

const MONGO_URI = "mongodb+srv://iadhkhai_db_user:Z7FTxfb9uf7VBcq6@supervision.adv03ua.mongodb.net/?appName=Supervision";

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
