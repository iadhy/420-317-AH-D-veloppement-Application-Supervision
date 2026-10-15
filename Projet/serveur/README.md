# Supervision : 420-317-AH

## Ce que vous recevez

Ce serveur est le corrigé des séances 5 à 13 : API REST, MongoDB, sécurité (comptes, rôles,
durcissement) et temps réel (Socket.IO). Il est complet, **sauf la liaison avec MQTT**, que vous
écrivez dans le cadre du projet final.

Il ne contient pas le tableau de bord : le dossier `src/public/` vient du projet fourni à la
séance 13 (voir son `README.md`). Gardez le vôtre.

**Socket.IO est déjà branché** (`initRealtime` dans `src/index.js`) : le projet ne porte que sur MQTT.

## Ce qu'il vous reste à faire : brancher MQTT

Tout est repéré par un commentaire. Cherchez `TODO` et `LIEN MQTT` dans les trois fichiers ci-dessous, et dans aucun autre.

| Où | Quoi |
|---|---|
| `src/mqtt.js`, TODO 1 | `topicOf` : la forme du sujet d'un capteur |
| `src/mqtt.js`, TODO 2 | `parseMeasure` : lire et valider un message |
| `src/mqtt.js`, TODO 3 | `startMqtt` : se connecter au courtier, s'abonner, recevoir |
| `src/mqtt.js`, TODO 4 et 5 | `subscribeSensor` et `unsubscribeSensor` |
| `src/index.js`, LIEN MQTT 1 | démarrer la passerelle au lancement du serveur |
| `src/controllers/sensor.controller.js`, LIEN MQTT 2 | s'abonner quand un capteur est créé |
| `src/controllers/sensor.controller.js`, LIEN MQTT 3 | se désabonner quand un capteur est supprimé |
| `.env` | `MQTT_URL`, `MQTT_USERNAME`, `MQTT_PASSWORD` (voir `.env.exemple`) |

Rien d'autre ne change : une mesure MQTT entre par `ingest` (`services/acquisition.service.js`),
comme celle du capteur simulé, et se retrouve enregistrée, comparée au seuil et diffusée.

### La convention MQTT

- un capteur = un sujet : `supervision/<identifiant du capteur>`;
- un message = une seule mesure : `{ "value": 22.4 }`;
- le serveur est abonné au sujet de **tout** capteur présent en base, actif ou non : un capteur
  désactivé continue d'enregistrer ses mesures;
- un message mal formé, ou pour un capteur inconnu, est journalisé puis ignoré; le serveur ne
  s'arrête jamais.

### Vérifier son travail

1. `npm run test:mqtt` : vérifie `topicOf` et `parseMeasure`, sans courtier ni base. Tant que le
   travail n'est pas fait, les tests échouent : c'est normal.
2. Se connecter au courtier avec un client MQTT web, créer un capteur par l'API, publier
   `{ "value": 22.4 }` sur son sujet : la mesure apparaît dans `GET /api/measures?sensor=...` et
   sur le tableau de bord.
3. Publier n'importe quoi (`{pas du json`, `{ "value": "22" }`) : le serveur le journalise et continue.
4. Désactiver puis supprimer le capteur par l'API, publier de nouveau : la mesure est enregistrée
   tant que le capteur existe, même désactivé, et plus du tout après la suppression.

### Essayer le tableau de bord sans carte

Dans `.env`, `SIMULATE_SENSOR=true` démarre le capteur simulé de la séance 2, qui alimente le
capteur nommé `temp-b127` (à créer par l'API). Laissez-le éteint avec une vraie carte : deux
sources alimenteraient le même capteur.

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

## Temps réel (séance 12)

**Le socket va dans un seul sens** : le serveur diffuse, les clients écoutent. Toute action passe
par l'API REST, donc par `protect` et `authorize`. Aucune écoute de commandes, aucune route pour
créer une mesure : les mesures naissent du capteur, puis arrivent par MQTT.

La connexion exige le même jeton JWT qu'en REST (`auth: { token }`). Tout rôle peut se connecter.

| Événement | Contenu | Quand |
|---|---|---|
| `measure` | la mesure enregistrée | chaque mesure d'un capteur **actif** |
| `alert` | `{ sensor, value, threshold, direction, createdAt }` | la mesure vient de dépasser le seuil |
| `recovery` | même forme | la mesure vient de revenir dans la normale |
| `sensor:created` | le capteur | après un `POST /api/sensors` réussi |
| `sensor:updated` | le capteur à jour | après un `PUT /api/sensors/:id` réussi |
| `sensor:deleted` | `{ id }` | après un `DELETE /api/sensors/:id` réussi |

### Le fil d'une mesure

`ingest` (`services/acquisition.service.js`) est le point d'entrée unique :

1. la mesure est **toujours enregistrée**, même si le capteur est désactivé ou absent de la base;
2. si le capteur est inconnu ou désactivé, on s'arrête là (rien n'est diffusé);
3. sinon : `emit("measure")`, puis `monitor.check`.

Un message MQTT appelle la même fonction que le capteur simulé : c'est `mqtt.js` qui le fait.

### Le moniteur

N'annonce que les **changements d'état** : `alert` au dépassement, `recovery` au retour. Il retient
en mémoire, par capteur, s'il est déjà en alerte. Seuil et direction sont lus en base à chaque
mesure : modifier un seuil par l'API prend effet immédiatement.

### Points de conception

**`server.listen`, pas `app.listen`.** Socket.IO s'attache au serveur HTTP créé dans `index.js`.
Avec `app.listen`, l'API répond mais `/socket.io/` renvoie 404.

**Socket.IO a son propre CORS.** Le `cors()` d'Express ne le couvre pas : `realtime.js` lit la même
variable `CORS_ORIGIN`.

**`.catch` sur `ingest`.** Une promesse rejetée dans un gestionnaire d'événement n'a personne à
qui remonter : sans `.catch`, une panne de base arrêterait le processus.

**Page de diagnostic.** `http://localhost:3000/live.html` : coller un jeton, se connecter, voir
chaque événement. Le script est dans un fichier séparé (`live.js`) parce que la politique de
`helmet` interdit les scripts en ligne.

**Reconnexion.** Le client se reconnecte seul avec le même jeton; après son expiration (2 h), la
reconnexion est refusée.

## Configuration

Copier `.env.exemple` en `.env` et remplir :

```
PORT=3000
MONGO_URI=mongodb+srv://user:motdepasse@cluster0.xxxxx.mongodb.net/supervision
JWT_SECRET=une-longue-chaine-aleatoire
CORS_ORIGIN=http://localhost:5500        (facultatif)
SEED_ADMIN_PASSWORD=...
SEED_OPERATOR_PASSWORD=...
MQTT_URL=mqtts://xxxx.emqxsl.com:8883
MQTT_USERNAME=...
MQTT_PASSWORD=...
SIMULATE_SENSOR=false                    (facultatif)
```

Le fichier `.env` n'est **jamais** versionné. `JWT_SECRET` est obligatoire : le serveur refuse de
démarrer sans lui.

## Modèles

| Collection | Champs |
|---|---|
| `sensors` | `_id` (texte, choisi par l'utilisateur), `name`, `room`, `unit`, `min`, `max`, `threshold`, `direction`, `active` |
| `measures` | `sensor` (texte → Sensor), `value`, `createdAt` |

`Sensor._id` est une chaîne choisie par l'utilisateur, pas un ObjectId généré par Mongo : cet
identifiant est la fin du sujet MQTT auquel le serveur s'abonne : `supervision/<_id>`.

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
| `?sort=` | `createdAt` ou `value` (tout autre nom retombe sur `createdAt`) |
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
`> 0` mais échoue `Number.isInteger(...)` : sans ce test, une page non entière produirait un
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
| `realtime.test.js` | `Monitor` (alert/recovery), socket authentifié (sans base de données) | 13 |

`npm test` lance ces quatre fichiers. `npm run test:mqtt` lance `mqtt.test.js` (18 tests sur
`topicOf` et `parseMeasure`), qui échoue tant que `src/mqtt.js` n'est pas écrit.

Ils s'exécutent sans connexion à MongoDB. L'inscription, la connexion réussie et la
suppression par un admin se vérifient à la main avec Thunder Client.

## Préparer un volume réaliste

```
npm run seed
```

Insère 10 000 mesures pour un capteur déjà existant, avec des horodatages réalistes espacés de
2 secondes. Nécessite une connexion (ce n'est pas un test hors ligne).

## Lancer

```
npm install
npm run dev
```
