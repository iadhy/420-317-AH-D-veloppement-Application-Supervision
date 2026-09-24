// Quatre parametres : c'est a cela qu'Express reconnait un middleware d'erreur.
export function errorHandler(err, req, res, next) {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message });
}
