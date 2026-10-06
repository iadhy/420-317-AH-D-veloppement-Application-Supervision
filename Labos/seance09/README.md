# Supervision — 420-317-AH

## État après la séance 9

La pagination complète les routes de consultation posées à la séance 8 : filtrer, trier,
découper en pages. La persistance (séance 7) et le découpage en couches (séance 5-6) n'ont pas
bougé.

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

`Sensor._id` est une chaîne choisie par l'utilisateur, pas un ObjectId généré par Mongo — cet
identifiant deviendra le nom du sujet MQTT auquel le serveur s'abonnera (séance 14).

## Deux ressources, deux étendues

**`sensors` : CRUD complet.** **`measures` : lecture seule**, quatre `GET`, aucune route
d'écriture.

| | `sensors` | `measures` |
|---|---|---|
| Validation de l'id | `body("id")` + regex MQTT | `param("id").isMongoId()` |
| Identifiant dupliqué | `409` | n'arrive jamais (généré) |

Les deux validateurs partagent `handleValidationErrors` : un seul format de réponse d'erreur,
`{ errors: ["message", ...] }`.

## Filtrer, trier et paginer (séances 8-9)

`GET /api/measures` accepte des paramètres combinables :

| Paramètre | Effet |
|---|---|
| `?sensor=` | mesures de ce capteur |
| `?min=` / `?max=` | intervalle de valeurs |
| `?from=` / `?to=` | intervalle de dates |
| `?sort=` | `createdAt` ou `value` — tout autre nom retombe sur `createdAt` |
| `?order=` | `asc` ou `desc` (défaut) |
| `?page=` | page demandée, défaut 1 |
| `?limit=` | taille de page, défaut 20, **plafonnée à 100** |

**La réponse a changé de forme** depuis la séance 9 : elle renvoie maintenant un objet, pas un
tableau.

```json
{
  "data": [ /* les mesures de cette page */ ],
  "pagination": { "page": 1, "limit": 20, "total": 452, "pages": 23 }
}
```

Tout client déjà écrit qui ferait `.forEach()` ou `.map()` directement sur la réponse doit être
mis à jour pour lire `response.data`.

## Points de conception

**Le tri est obligatoire avec `skip`/`limit`.** Sans ordre garanti, MongoDB ne découpe pas une
liste stable : un document peut apparaître sur deux pages, un autre sur aucune.

**`countDocuments` reçoit le même `filter` que `find`.** Sinon le `total` annoncé ne correspond
pas aux données réellement filtrées.

**Le plafond (`LIMIT_MAX = 100`) est une protection distincte de la limite par défaut.** La
limite par défaut protège un client qui ne précise rien ; le plafond protège contre un client
qui demande délibérément `?limit=999999`.

**`Number.isInteger`, pas une simple comparaison `> 0`.** `Number("2.5")` vaut `2.5`, qui passe
`> 0` mais échoue `Number.isInteger(...)` — sans ce test, une page non entière produirait un
`skip` non entier.

**Index.** Sur `sensor` et `createdAt`, déclarés dès la séance 7, utilisés par les filtres, le
tri et la pagination.

## Tests

```
npm test
```

| Fichier | Teste | Nombre |
|---|---|---|
| `schema.test.js` | Contraintes Mongoose (`validateSync()`) | 12 |
| `query.test.js` | `buildFilter`, `buildSort`, `buildPagination`, `buildPaginationMeta` | 22 |

Les deux s'exécutent sans connexion à MongoDB.

## Préparer un volume réaliste

```
npm run seed
```

Insère 10 000 mesures pour un capteur déjà existant, avec des horodatages réalistes espacés de
2 secondes. Nécessite une connexion — ce n'est pas un test hors ligne.

## Lancer

```
npm install
npm run dev
```
