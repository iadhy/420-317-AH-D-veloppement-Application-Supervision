import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

// Le role n'est pas un parametre : tout compte cree par l'API est un reader.
// Un operator ou un admin se cree autrement (npm run seed:users).
export async function register({ email, password }) {
  const user = await User.create({ email, password });
  return { id: user._id, email: user.email, role: user.role };
}

// Retourne null si le courriel est inconnu OU si le mot de passe est faux :
// l'appelant ne peut pas (et ne doit pas) savoir lequel des deux.
export async function login({ email, password }) {
  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    return null;
  }

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "2h" },
  );

  return { token, user: { id: user._id, email: user.email, role: user.role } };
}
