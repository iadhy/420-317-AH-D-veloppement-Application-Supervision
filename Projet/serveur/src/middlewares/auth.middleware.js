import jwt from "jsonwebtoken";

// Authentification : qui es-tu ? Absence ou invalidite du jeton => 401.
export function protect(req, res, next) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Jeton absent" });
  }

  try {
    const token = header.slice("Bearer ".length);
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch {
    res.status(401).json({ error: "Jeton invalide ou expire" });
  }
}

// Autorisation : as-tu le droit ? Identifie mais pas autorise => 403.
// Toujours placee APRES protect, car elle lit req.user.
export function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Acces refuse" });
    }
    next();
  };
}
