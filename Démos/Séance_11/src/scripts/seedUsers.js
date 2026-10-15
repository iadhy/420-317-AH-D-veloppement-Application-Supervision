import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/user.model.js";

/**
 * Cree un administrateur et un operateur.
 *
 * Il n'existe volontairement AUCUNE route pour creer un compte privilegie :
 * POST /api/auth/register fabrique toujours un reader. Les comptes
 * privilegies naissent ici, avec acces a la base.
 *
 * Les mots de passe viennent du fichier .env, jamais du code :
 *   SEED_ADMIN_PASSWORD=...
 *   SEED_OPERATOR_PASSWORD=...
 *
 * Relancer le script est sans danger : un compte existant n'est pas recree.
 *
 * Usage : npm run seed:users
 */

const COMPTES = [
  { email: "admin@supervision.test", role: "admin", variable: "SEED_ADMIN_PASSWORD" },
  { email: "operator@supervision.test", role: "operator", variable: "SEED_OPERATOR_PASSWORD" },
];

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI absent : verifiez votre fichier .env");
    process.exit(1);
  }

  for (const { variable } of COMPTES) {
    if (!process.env[variable]) {
      console.error(`${variable} absent : verifiez votre fichier .env`);
      process.exit(1);
    }
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });

  for (const { email, role, variable } of COMPTES) {
    const existant = await User.findOne({ email });
    if (existant) {
      console.log(`Deja present : ${email} (${existant.role})`);
      continue;
    }
    // create() passe par save() : le hook de hachage s'applique.
    await User.create({ email, password: process.env[variable], role });
    console.log(`Cree : ${email} (${role})`);
  }

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error("Echec :", error.message);
  process.exit(1);
});
