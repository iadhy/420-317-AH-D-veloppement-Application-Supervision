import rateLimit from "express-rate-limit";

// 5 tentatives par minute et par adresse IP, sur la connexion seulement.
// Le message par defaut de la librairie est du texte brut : on le remplace
// pour garder une API qui repond toujours en JSON.
export const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: "Trop de tentatives, reessayez dans une minute" },
});
