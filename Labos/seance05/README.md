# Supervision — 420-317-AH

## État après la séance 5

Même API qu'à la séance 3, réécrite en Express et découpée en trois couches.

| Route | Renvoie | Codes |
|---|---|---|
| `GET /api/measures` | toutes les mesures | 200 |
| `GET /api/measures?min=` | celles au-dessus du seuil | 200 |
| `GET /api/measures/latest` | la plus récente | 200 / 404 |
| `GET /api/measures/stats` | min, max, moyenne, nombre | 200 |
| `POST /api/measures` | la mesure créée | 201 / 400 |
| toute autre | erreur JSON | 404 |

## Ce qu'Express a remplacé

| Pénible en séance 3 | Réglé par |
|---|---|
| Chaque route répète méthode et chemin | `router.get("/chemin", controleur)` |
| Un `return` oublié fait répondre deux fois | un contrôleur par route |
| Assembler le corps du POST à la main | `express.json()` |
| Une condition et un `Content-Type` par fichier | `express.static("src/public")` |
| `writeHead` + `JSON.stringify` partout | `res.status(...).json(...)` |

## Structure

```
src/app.js          configuration Express, ordre des middlewares
src/index.js        démarrage du capteur et du serveur
src/routes/         quelles URL existent
src/controllers/    lire req, choisir le code, répondre
src/services/       la logique — ni req ni res ici
src/middlewares/    journalisation et gestion des erreurs
```

## Lancer

```
npm install
npm run dev
```
