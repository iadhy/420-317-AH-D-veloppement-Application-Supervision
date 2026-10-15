// Quatre parametres : c'est a cela qu'Express reconnait un middleware d'erreur.
export function errorHandler(err, req, res, next) {
  console.error(err);

  const status = err.status || 500;

  // Une erreur serveur peut contenir des details internes (requete, chemin,
  // nom de collection) : on les garde dans la console, pas dans la reponse.
  // Les erreurs 4xx (JSON malforme, corps trop gros) sont celles du client :
  // leur message lui est utile.
  const message = status >= 500 ? "Erreur interne du serveur" : err.message;

  res.status(status).json({ error: message });
}
