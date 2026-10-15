# Supervision — 420-317-AH

## État après la séance 11

L'API exige maintenant un compte et un rôle. Les séances 5 à 9 (couches, REST, Mongoose,
filtres, pagination) n'ont pas bougé : on a ajouté une couche de sécurité autour.

### Rappel de la séance 9

La pagination complète les routes de consultation posées à la séance 8 : filtrer, trier,
découper en pages. La persistance (séance 7) et le découpage en couches (séance 5-6) n'ont pas
bougé.

## Sécurité (séance 11)

### Comptes

| Collection | Champs |
|---|---|
| `users` | `email` (unique, minuscules), `password` (haché avec bcrypt, `select: false`), `role` (`reader` par défaut, `operator`, `admin`) |

`POST /api/auth/register` crée **toujours** un `reader`, quel que soit le corps envoyé. Les comptes
`operator` et `admin` se créent avec :

```
npm run seed:users
```

(mots de passe lus dans `.env`; le script peut être relancé sans créer de doublons).

### Routes et rôles

| Route | sans jeton | reader | operator | admin |
|---|---|---|---|---|
| `POST /api/auth/register`, `login` | ouverte | ouverte | ouverte | ouverte |
| `GET /api/sensors`, `/:id` | 401 | oui | oui | oui |
| `GET /api/measures`, `/latest`, `/stats`, `/:id` | 401 | oui | oui | oui |
| `POST /api/sensors` | 401 | 403 | oui | oui |
| `PUT /api/sensors/:id` | 401 | 403 | oui | oui |
| `DELETE /api/sensors/:id` | 401 | 403 | 403 | oui |

`protect` est monté sur chaque routeur dans `app.js`; `authorize(...)` est placé **avant** le
validateur dans `sensor.routes.js` (un reader reçoit 403, pas 400).

### Durcissement, dans l'ordre de `app.js`

1. `helmet()` : en-têtes de sécurité sur toutes les réponses.
2. `cors({ origin })` seulement si `CORS_ORIGIN` existe, **avant** `protect` (une pré-vérification
   `OPTIONS` ne porte pas de jeton).
3. `express.json({ limit: "10kb" })` : 413 au-delà.
4. `loginLimiter` : 5 tentatives par minute sur `/api/auth/login`, 429 en JSON.
5. `errorHandler` : une erreur 5xx renvoie un message générique; les 4xx gardent le leur.

Une connexion échouée renvoie toujours `401 Identifiants invalides`, que le courriel existe ou non.

### Points de conception

**Le hash n'est jamais renvoyé.** `select: false` sur le modèle, et les services renvoient des
objets construits champ par champ.

**`isModified("password")` dans le hook.** Sans lui, changer le rôle d'un compte hacherait un hash
déjà haché.

**Le rôle vient du jeton, jamais du corps.** `register` ne reçoit que `email` et `password`.

## Configuration

Copier `.env.exemple` en `.env` et remplir :

```
PORT=3000
MONGO_URI=mongodb+srv://user:motdepasse@cluster0.xxxxx.mongodb.net/supervision
JWT_SECRET=une-longue-chaine-aleatoire
CORS_ORIGIN=http://localhost:5500        (facultatif)
SEED_ADMIN_PASSWORD=...
SEED_OPERATOR_PASSWORD=...
```

Le fichier `.env` n'est **jamais** versionné. `JWT_SECRET` est obligatoire : le serveur refuse de
démarrer sans lui.

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
| `schema.test.js` | Contraintes Mongoose (`validateSync()`) | 11 |
| `query.test.js` | `buildFilter`, `buildSort`, `buildPagination`, `buildPaginationMeta` | 22 |
| `auth.test.js` | Schéma `User`, 401/403, `helmet`, CORS, 413, 429 (sans base de données) | 22 |

Les trois s'exécutent sans connexion à MongoDB. L'inscription, la connexion réussie et la
suppression par un admin se vérifient à la main avec Thunder Client.

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
