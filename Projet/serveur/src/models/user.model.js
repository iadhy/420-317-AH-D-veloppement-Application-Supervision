import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  // select: false : le hash n'est JAMAIS renvoye par une requete ordinaire.
  // Pour le lire (a la connexion), il faut le demander : .select("+password")
  password: {
    type: String,
    required: true,
    select: false,
  },
  role: {
    type: String,
    enum: ["reader", "operator", "admin"],
    default: "reader",
  },
});

// Avant chaque save() : on hache, a moins que le mot de passe n'ait pas bouge.
// Sans isModified, un simple changement de role hacherait un hash deja hache.
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model("User", userSchema);
