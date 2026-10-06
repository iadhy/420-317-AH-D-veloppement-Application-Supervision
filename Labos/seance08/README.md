# Supervision — 420-317-AH

## État après la séance 8

L'API de consultation des mesures est complète : filtrer, trier, en plus des routes de lecture
simples posées à la séance 6. La persistance (séance 7) et le découpage en couches (séance 5-6)
n'ont pas bougé.

## Configuration

Copier `.env.exemple` en `.env` et remplir :

```
MONGO_URI=mongodb+srv://user:motdepasse@cluster0.xxxxx.mongodb.net/supervision
PORT=3000
```

## Modèles

| Collection | Champs |
|---|---|
| `sensors` | `_id` (texte, choisi par l'utilisateur), `name`, `room`, `unit`, `min`, `max`, `threshold`, `direction`, `active` |
| `measures` | `sensor` (texte → Sensor), `value`, `createdAt` |

**`Sensor._id` est une chaîne choisie par l'utilisateur**, pas un ObjectId généré par Mongo —
cet identifiant deviendra le nom du sujet MQTT auquel le serveur s'abonnera (séance 14).
`Measure.sensor` est donc une chaîne elle aussi (`type: String`), pas un ObjectId.

## Deux ressources, deux étendues

**`sensors` : CRUD complet.** C'est le tableau de bord qui crée un capteur, pour commencer à
écouter le bon sujet MQTT. `POST` exige `id` dans le corps; `PUT` ne le permet jamais (l'id ne
se modifie pas après la création — il n'apparaît même pas dans `validateSensorUpdate`).

**`measures` : lecture seule.** Quatre `GET`, rien d'autre. Aucune mesure n'est créée par une
route HTTP — elle arrive par le capteur simulé ou par MQTT (séance 14), directement dans
`measure.service.js` via `add()`, qui n'est jamais exposée par un contrôleur.

| | `sensors` | `measures` |
|---|---|---|
| Validation de l'id | `body("id")` + regex MQTT (`sensor.validator.js`) | `param("id").isMongoId()` (`measure.validator.js`) |
| Identifiant dupliqué | `409`, erreur Mongo 11000 | n'arrive jamais (généré) |
| Routes d'écriture | `POST`, `PUT`, `DELETE` | aucune |

Les deux validateurs partagent `handleValidationErrors`
(`src/middlewares/validationErrors.middleware.js`) : un seul format de réponse d'erreur,
`{ errors: ["message", ...] }`.

## Filtrer et trier (séance 8)

`GET /api/measures` accepte des paramètres combinables :

| Paramètre | Effet |
|---|---|
| `?sensor=` | mesures de ce capteur |
| `?min=` / `?max=` | intervalle de valeurs |
| `?from=` / `?to=` | intervalle de dates |
| `?sort=` | `createdAt` ou `value` — tout autre nom retombe sur `createdAt` |
| `?order=` | `asc` ou `desc` (défaut) |

`buildFilter` et `buildSort` (`src/utils/query.js`) sont des fonctions pures, testables sans
base de données.

## Tests

```
npm test
```

| Fichier | Teste | Nombre |
|---|---|---|
| `schema.test.js` | Contraintes Mongoose (`validateSync()`) | 12 |
| `query.test.js` | `buildFilter` et `buildSort` | 13 |

Les deux s'exécutent sans connexion à MongoDB.

## Lancer

```
npm install
npm run dev
```
