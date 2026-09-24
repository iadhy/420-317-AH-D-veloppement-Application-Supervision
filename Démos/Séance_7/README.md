# Supervision — 420-317-AH

## État après la séance 7

Persistance dans MongoDB Atlas. Les routes n'ont pas changé depuis la séance 6 — seule la
couche service est réécrite sur Mongoose.

## Configuration

Copier `.env.exemple` en `.env` :

```
MONGO_URI=mongodb+srv://user:motdepasse@cluster0.xxxxx.mongodb.net/supervision
PORT=3000
```

Le nom de la base (`/supervision`) doit apparaître avant le sinon les documents partent
dans une base nommée `test`.

## Décision de conception : l'identifiant du capteur

`Sensor._id` est une **chaîne choisie par l'utilisateur**, pas un ObjectId généré par Mongo.
Cet identifiant deviendra le nom du sujet MQTT auquel le serveur s'abonnera (séance 14) —
raison pour laquelle il est contraint à `/^[a-zA-Z0-9_-]+$/` dans le schéma.

`Measure.sensor` est donc une chaîne aussi (`type: String`), pas un `ObjectId` — `ref: "Sensor"`
continue de fonctionner avec `populate`, Mongoose matche sur `_id` quel que soit son type.

**`ref` ne garantit aucune intégrité référentielle.** Une mesure peut être créée avec un
`sensor` qui ne correspond à aucun document `Sensor` existant — aucune erreur n'est levée, ni à
l'écriture ni à la lecture. `populate` renvoie simplement `null` pour ce champ si le document
référencé n'existe pas. Le seul endroit où ce lien devient une vraie règle appliquée, c'est la
séance 14 : l'acquisition MQTT ne s'abonnera qu'aux sujets des capteurs actifs en base.

**Deux `_id`, deux comportements distincts, à ne pas confondre :**

| | `sensors` | `measures` |
|---|---|---|
| `_id` | chaîne, choisie par l'utilisateur | ObjectId, généré par Mongo |
| Validation de l'id | `body("id")` avec une regex MQTT, dans `sensor.validator.js` | `param("id").isMongoId()`, dans `measure.validator.js` |
| Identifiant dupliqué | `409`, erreur Mongo 11000 | n'arrive jamais (généré) |
| Identifiant mal formé | n'importe quelle chaîne non vide passe | `400` via `.matches(/^[a-zA-Z0-9_-]+$/)` |

Les deux validateurs partagent `handleValidationErrors` (`src/middlewares/validationErrors.middleware.js`) : un seul endroit qui décide du format de réponse en cas d'erreur, `{ errors: ["message", ...] }`, réutilisé partout plutôt que dupliqué.

## Modèles

| Collection | Champs |
|---|---|
| `sensors` | `_id` (texte), `name`, `unit`, `min`, `max`, `threshold`, `direction`, `active` |
| `measures` | `sensor` (texte → Sensor), `value`, `createdAt` |

## Points de conception

**Mises à jour.** `{ new: true, runValidators: true }` sur `findByIdAndUpdate` : sans la
première option on récupère l'ancien document, sans la seconde le schéma n'est pas vérifié.

**Index.** Sur `sensor` et `createdAt` — les champs de filtre et de tri de la séance 8.

## Tests

```
npm test
```

Dix tests de schéma, exécutables **sans connexion**, dont la validation de format d'un
identifiant compatible MQTT.

## Lancer

```
npm install
npm run dev
```

Créez d'abord un capteur `temp-b127` via `POST /api/sensors` pour que le `populate` des mesures
produites par le capteur simulé renvoie un objet plutôt que `null`.
