# Guide de compréhension du projet — Supervision (séance 9)

## 1. But et périmètre

Ce document explique le code de `Labos/seance09` : son organisation, son démarrage, le
chemin suivi par les requêtes et les mesures, les responsabilités de chaque module, puis
une méthode pour le réécrire sans perdre son comportement.

Le dépôt parent contient plusieurs exercices indépendants sous `Démos/` et `Labos/`.
Ils ne forment pas une seule application assemblée. Le guide porte sur le projet de la
séance 9, dans ce dossier, et non sur l'ensemble des séances précédentes ou suivantes.

L'application est un serveur Node.js qui expose une API REST Express pour gérer des
capteurs et consulter des mesures stockées dans MongoDB. Elle inclut également un
capteur simulé en mémoire, un moniteur de seuils, et une petite page HTML statique. La
page statique est un écran minimal de disponibilité, pas une interface de gestion
interactive.

### Résumé en une phrase

**Au démarrage, le programme se connecte à MongoDB, cherche un capteur connu et, s'il
existe, simule une mesure toutes les deux secondes, l'enregistre puis vérifie son seuil;
en parallèle, Express sert la page statique et les API de gestion des capteurs et de
consultation des mesures.**

## 2. Architecture du dossier

```text
Labos/seance09/
├── package.json                 scripts, mode ESM et dépendances Node
├── README.md                    consignes de lancement et comportements de la séance
├── docs/
│   └── questions.md             réponses/rappels pédagogiques de la séance 7
└── src/
    ├── index.js                 composition et démarrage du processus
    ├── app.js                   configuration Express et ordre des middlewares/routes
    ├── sensor.js                capteur simulé, producteur d'événements "measure"
    ├── monitor.js               règle de détection et émission d'événements "alert"
    ├── stats.js                  calcul statistique simple en mémoire
    ├── config/
    │   └── db.js                connexion et contrôle de configuration MongoDB
    ├── controllers/             traduction HTTP ↔ opérations applicatives
    ├── middlewares/             journalisation, validation et erreurs
    ├── models/                  schémas et modèles Mongoose
    ├── public/                  fichiers statiques servis par Express
    ├── routes/                  association des URL et méthodes aux contrôleurs
    ├── services/                accès aux modèles et opérations métier/données
    ├── tests/                   tests hors ligne et script d'insertion de données
    └── utils/
        └── query.js             traduction sûre des paramètres de recherche
```

Les couches suivent un sens général :

```text
Navigateur / client HTTP
          │
          ▼
app.js : middlewares Express → routeur
          │
          ▼
routes/ : méthode + URL + validation
          │
          ▼
controllers/ : réponse HTTP et délégation
          │
          ▼
services/ : opérations applicatives et requêtes Mongoose
          │
          ▼
models/ : schémas MongoDB
```

Le chemin du capteur simulé est séparé de l'API HTTP :

```text
index.js → sensor.js → événement "measure"
                    → measure.service.add() → MongoDB
                    → monitor.check() → événement "alert" → console
```

## 3. Technologies et configuration

Le `package.json` déclare un projet JavaScript Node.js en modules ECMAScript (`"type":
"module"`). L'entrée déclarée du paquet est `src/index.js`. Les versions des dépendances
sont indiquées par des plages dans le manifeste; les dépendances principales sont :

| Dépendance | Rôle dans l'application |
|---|---|
| `express` | serveur HTTP, routage et fichiers statiques |
| `express-validator` | validation des paramètres et corps HTTP |
| `mongoose` | schémas, modèles et accès à MongoDB |
| `dotenv` | chargement des variables d'environnement avec `dotenv/config` |
| `nodemon` (développement) | redémarrage du serveur pendant le développement |

Les commandes déclarées sont :

| Commande | Effet |
|---|---|
| `npm start` | démarre `node src/index.js` |
| `npm run dev` | démarre le même point d'entrée avec Nodemon |
| `npm test` | exécute d'abord les tests de schémas, puis ceux de construction des requêtes |
| `npm run seed` | insère 10 000 mesures dans MongoDB pour un capteur existant |

Le processus attend `MONGO_URI` pour se connecter à la base et utilise `PORT` pour le
serveur HTTP (3000 par défaut). Le README explique de copier `.env.exemple` en `.env`,
mais aucun fichier modèle `.env.exemple` n'est présent dans le dossier de séance 9 tel
qu'il est actuellement fourni. Il faut donc créer le fichier localement avec les
variables attendues; ne jamais publier une vraie chaîne de connexion ni ses identifiants.

## 4. Point d'entrée et démarrage complet

Le point d'entrée réel est [`src/index.js`](./src/index.js). Il orchestre les composants,
mais la configuration Express elle-même est construite dans
[`src/app.js`](./src/app.js).

### Ordre de démarrage

1. `import "dotenv/config"` charge les variables du fichier `.env` dans `process.env`.
2. `app.js` est importé et construit l'application Express.
3. `connectDatabase()` vérifie `MONGO_URI`, puis attend la connexion Mongoose.
   - Variable absente : message d'erreur et arrêt avec code de sortie 1.
   - Connexion impossible : journalisation de l'erreur et arrêt avec code 1.
   - La connexion réussit : le démarrage continue.
4. Le programme cherche le capteur dont l'identifiant est fixé à `temp-b127`.
5. Si ce capteur est absent, un avertissement explique de le créer par l'API. Le serveur
   HTTP peut quand même démarrer, mais aucune acquisition simulée n'est lancée.
6. Si le capteur existe, `index.js` construit un `Monitor` avec son seuil et sa direction,
   puis branche l'événement `alert` sur un message console.
7. Le `Sensor` simulé reçoit l'identifiant, `min` et `max` provenant du document MongoDB.
   Son événement `measure` appelle `measureService.add()`. Après l'enregistrement réussi,
   la mesure est transmise au moniteur.
8. Enfin, Express écoute sur `process.env.PORT` ou le port 3000.

**Conséquence importante :** la connexion MongoDB est obligatoire au démarrage, même si
le capteur simulé n'est pas présent. L'API n'est pas lancée en mode déconnecté.

## 5. Parcours d'une requête HTTP

Dans `app.js`, l'ordre de déclaration détermine l'ordre d'exécution des middlewares :

1. `logger` écrit la méthode et l'URL demandées.
2. `express.json()` analyse les corps de requête JSON.
3. `express.static("src/public")` sert les fichiers de l'interface statique.
4. `/api/measures` est confié au routeur des mesures.
5. `/api/sensors` est confié au routeur des capteurs.
6. Une requête qui n'a correspondu à aucune ressource obtient un `404` JSON.
7. `errorHandler`, déclaré en dernier, reçoit les erreurs propagées par `next(error)`.

Une route suit habituellement ce parcours :

```text
requête
  → logger / analyse JSON
  → routeur (chemin et méthode)
  → validateur, s'il y en a un
  → contrôleur
  → service
  → modèle Mongoose / MongoDB
  ← résultat
  ← code HTTP et JSON produits par le contrôleur
```

Les contrôleurs interceptent leurs erreurs asynchrones et les transmettent à Express avec
`next(error)`. Le middleware global journalise ensuite l'erreur et répond avec son code
`status`, ou `500` si aucun code n'est défini.

## 6. Routes et contrats HTTP

### Capteurs : CRUD complet

Le routeur est [`src/routes/sensor.routes.js`](./src/routes/sensor.routes.js).

| Méthode | URL | Validation | Résultat attendu |
|---|---|---|---|
| `GET` | `/api/sensors` | aucune validation dédiée | liste des capteurs |
| `GET` | `/api/sensors/:id` | aucune validation dédiée | capteur ou `404` |
| `POST` | `/api/sensors` | `validateSensorCreate` | création, `201`; identifiant déjà utilisé : `409` |
| `PUT` | `/api/sensors/:id` | `validateSensorUpdate` | remplacement/mise à jour, ou `404` |
| `DELETE` | `/api/sensors/:id` | aucune validation dédiée | suppression, `204`, ou `404` |

Lors de la création, le champ API `id` est affecté à `_id` dans MongoDB. Le validateur
restreint cet identifiant aux lettres, chiffres, tirets et underscores. L'identifiant
choisi est une chaîne, pas un `ObjectId` MongoDB. Lors de la mise à jour, le validateur
ne permet pas de changer cet identifiant.

### Mesures : API en lecture seule

Le routeur est [`src/routes/measure.routes.js`](./src/routes/measure.routes.js). Il expose
quatre routes `GET` et aucune route HTTP de création, modification ou suppression :

| Méthode | URL | Rôle |
|---|---|---|
| `GET` | `/api/measures` | recherche, filtre, tri et pagination |
| `GET` | `/api/measures/latest` | mesure la plus récente |
| `GET` | `/api/measures/stats` | statistiques globales de toutes les mesures |
| `GET` | `/api/measures/:id` | mesure par `ObjectId`; identifiant invalide : `400`, absent : `404` |

Les segments fixes `/latest` et `/stats` sont enregistrés avant `/:id`; sinon le segment
`latest` ou `stats` pourrait être pris pour une valeur d'identifiant.

La lecture paginée accepte les paramètres combinables suivants :

| Paramètre | Comportement constaté |
|---|---|
| `sensor` | limite au capteur donné |
| `min`, `max` | filtre `value` avec bornes inclusives `$gte` et `$lte` |
| `from`, `to` | filtre `createdAt` avec bornes inclusives `$gte` et `$lte` |
| `sort` | `createdAt` ou `value`; toute autre valeur utilise `createdAt` |
| `order` | exactement `asc` donne l'ordre croissant; sinon l'ordre est décroissant |
| `page` | entier positif; sinon page 1 |
| `limit` | entier positif, défaut 20, plafond 100 |

Exemple :

```http
GET /api/measures?sensor=temp-b127&min=20&from=2026-01-01&sort=value&order=asc&page=2&limit=10
```

La réponse de liste est un objet, pas un tableau nu :

```json
{
  "data": [],
  "pagination": {
    "page": 2,
    "limit": 10,
    "total": 35,
    "pages": 4
  }
}
```

Les clients doivent donc lire `response.data` avant d'itérer sur les mesures. Pour la
liste, `populate("sensor", "name unit")` remplace la référence de capteur par les champs
`name` et `unit` sélectionnés. Les routes de mesure individuelles et `/latest` font aussi
ce `populate`.

## 7. Explication de chaque module

### Démarrage, serveur et acquisition

- [`src/index.js`](./src/index.js) — composition et démarrage. Connecte la base, cherche le
  capteur simulé `temp-b127`, crée et relie le moniteur et le simulateur, puis ouvre le
  serveur HTTP. La persistance de la mesure précède le contrôle du seuil.
- [`src/app.js`](./src/app.js) — construit l'application Express, installe les middlewares,
  monte les deux routeurs API et définit les réponses 404 et d'erreur.
- [`src/config/db.js`](./src/config/db.js) — connexion Mongoose. L'absence d'URI ou l'échec
  de connexion est fatal au démarrage.
- [`src/sensor.js`](./src/sensor.js) — classe `Sensor` simulée basée sur `EventEmitter`.
  `read()` produit une valeur aléatoire comprise entre `min` et `max` et arrondie à un
  chiffre après la virgule. `start()` émet `measure` à intervalles de deux secondes par
  défaut; `stop()` arrête l'intervalle.
- [`src/monitor.js`](./src/monitor.js) — classe `Monitor`, indépendante du capteur. Pour
  `direction: "above"`, elle alerte si `value > threshold`; pour `"below"`, elle alerte si
  `value < threshold`. L'égalité au seuil ne déclenche donc pas d'alerte. Une règle
  inconnue pour le capteur ne produit rien. L'alerte est un événement local affiché dans
  la console par `index.js`, pas une notification envoyée à un utilisateur.
- [`src/stats.js`](./src/stats.js) — fonction pure `computeStats(measures)` qui calcule
  nombre, minimum, maximum et moyenne d'un tableau en mémoire. Pour un tableau vide, les
  statistiques valent `null` sauf le nombre, qui vaut 0. Cette fonction est conservée
  dans le projet, mais la route actuelle `/api/measures/stats` calcule ses statistiques
  avec une agrégation MongoDB dans le service; elle n'appelle pas `computeStats`.

### Routes, contrôleurs et services

- [`src/routes/sensor.routes.js`](./src/routes/sensor.routes.js) — associe les verbes HTTP
  des capteurs à leurs contrôleurs; les validations de création et de mise à jour sont
  exécutées avant ces contrôleurs.
- [`src/routes/measure.routes.js`](./src/routes/measure.routes.js) — associe les quatre
  lectures de mesures à leurs contrôleurs; seule la route `/:id` valide l'identifiant.
- [`src/controllers/sensor.controller.js`](./src/controllers/sensor.controller.js) —
  gère les réponses HTTP du CRUD capteur. Il choisit `200`, `201`, `204`, `404` ou `409`,
  et transfère les erreurs non traitées à Express.
- [`src/controllers/measure.controller.js`](./src/controllers/measure.controller.js) —
  gère les réponses de liste, de recherche par identifiant, de dernière mesure et de
  statistiques. Il produit `404` lorsqu'une ressource demandée n'existe pas.
- [`src/services/sensor.service.js`](./src/services/sensor.service.js) — encapsule les
  appels Mongoose pour créer, lister, rechercher, mettre à jour et supprimer les capteurs.
  La mise à jour active `new: true` pour renvoyer le document après modification et
  `runValidators: true` pour faire appliquer les validations Mongoose.
- [`src/services/measure.service.js`](./src/services/measure.service.js) — contient
  l'écriture interne `add`, les lectures, la pagination et l'agrégation statistique. `add`
  sert au simulateur; ce n'est pas une route HTTP. Le même filtre est donné à `find` et à
  `countDocuments`, afin que le total de pagination corresponde au jeu filtré.
- [`src/utils/query.js`](./src/utils/query.js) — transforme les paramètres textuels de
  l'URL en filtre, tri et pagination Mongoose. Il utilise une liste blanche de champs de
  tri et n'accepte que les paramètres explicitement reconnus, plutôt que de transmettre
  directement `req.query` à MongoDB.

### Modèles et middlewares

- [`src/models/sensor.model.js`](./src/models/sensor.model.js) — schéma du capteur. `_id`
  est une chaîne requise à caractères contrôlés; `name`, `unit`, `min`, `max`,
  `threshold` et `direction` sont requis; `direction` vaut `above` ou `below`; `active`
  vaut `true` par défaut.
- [`src/models/measure.model.js`](./src/models/measure.model.js) — schéma de mesure avec
  `sensor` (référence texte vers `Sensor`), `value` et `createdAt` (date actuelle par
  défaut). Des index sont déclarés sur `sensor` et `createdAt`.
- [`src/middlewares/logger.middleware.js`](./src/middlewares/logger.middleware.js) —
  journalise méthode et URL, puis appelle `next()`.
- [`src/middlewares/sensor.validator.js`](./src/middlewares/sensor.validator.js) —
  décrit les contraintes d'entrée pour création et mise à jour. Il délègue le format
  commun des erreurs au middleware de validation.
- [`src/middlewares/measure.validator.js`](./src/middlewares/measure.validator.js) —
  exige que l'identifiant de mesure soit un `ObjectId` Mongo valide avant la recherche.
- [`src/middlewares/validationErrors.middleware.js`](./src/middlewares/validationErrors.middleware.js) —
  collecte les erreurs `express-validator`; s'il y en a, répond `400` avec
  `{ "errors": ["message", ...] }`, sinon appelle `next()`.
- [`src/middlewares/error.middleware.js`](./src/middlewares/error.middleware.js) —
  journalise l'erreur et répond avec `err.status` ou `500`, sous la forme
  `{ "error": "..." }`.

### Fichiers statiques, tests et données de démonstration

- [`src/public/index.html`](./src/public/index.html) — page HTML française minimale
  indiquant que le serveur répond. Elle précise que l'affichage des données n'est pas
  encore livré dans cette séance.
- [`src/public/style.css`](./src/public/style.css) — styles élémentaires de cette page.
- [`src/tests/schema.test.js`](./src/tests/schema.test.js) — vérifie les contraintes
  Mongoose avec `validateSync()` sur des documents en mémoire, sans MongoDB.
- [`src/tests/query.test.js`](./src/tests/query.test.js) — teste les fonctions pures de
  `utils/query.js` sans serveur ni base de données.
- [`src/tests/seed.js`](./src/tests/seed.js) — script séparé qui génère 10 000 mesures
  espacées de deux secondes dans le passé, puis les insère dans MongoDB. Le capteur cible
  doit déjà exister. On peut remplacer `temp-b127` en passant un identifiant après `--`.
- [`docs/questions.md`](./docs/questions.md) — réponses pédagogiques conservées sur les
  mises à jour Mongoose et la différence entre un identifiant invalide (`400`) et un
  document absent (`404`); ce fichier n'est pas chargé par l'application.
- [`README.md`](./README.md) — documente configuration, modèles, pagination, tests,
  insertion de données et lancement.

## 8. Modèle de données et règles importantes

| Collection | Champs principaux | Utilisation |
|---|---|---|
| `sensors` | `_id` chaîne, `name`, `room`, `unit`, `min`, `max`, `threshold`, `direction`, `active` | configuration et description d'un capteur |
| `measures` | `sensor` chaîne, `value`, `createdAt` | historique des valeurs mesurées |

La référence d'une mesure vers un capteur est une chaîne qui correspond au `_id` choisi
par l'utilisateur. Ce n'est pas une clé `ObjectId`. `populate` s'appuie sur la référence
Mongoose, mais le schéma ne déclare pas de contrainte de clé étrangère MongoDB ni de
suppression en cascade.

Les mesures sont créées en interne par le service appelé depuis `index.js` (ou par le
script de seed); elles ne sont pas créables via les routes HTTP. Le seuil et la direction
appartiennent à la configuration du capteur, tandis que `sensor.js` ne fait que produire
des valeurs.

## 9. Astuces et pièges à maîtriser

1. **Ne confonds pas `app.js` et le point d'entrée.** `app.js` configure Express; `index.js`
   relie la base, le simulateur et le serveur.
2. **Respecte l'ordre Express.** Les middlewares s'exécutent dans l'ordre où ils sont
   enregistrés. L'erreur globale doit rester après les routes; les routes fixes doivent
   précéder un motif générique `/:id`.
3. **Garde les responsabilités séparées.** Les routes déclarent, les contrôleurs parlent
   HTTP, les services effectuent les opérations, les modèles décrivent les données et les
   utilitaires purs préparent les requêtes.
4. **Ne passe pas `req.query` directement à Mongoose.** `query.js` évite d'exposer les
   opérateurs MongoDB envoyés par un client; les champs de tri sont en liste blanche.
5. **Convertis les entrées URL.** Les valeurs de `req.query` sont des chaînes. Les bornes
   numériques et les dates sont converties avant d'être utilisées.
6. **Une pagination doit être déterministe.** Le tri doit être présent avant `skip` et
   `limit`; sinon les éléments peuvent se déplacer d'une page à l'autre.
7. **Le nombre total doit utiliser le même filtre.** C'est nécessaire pour que les
   métadonnées décrivent les résultats correspondant réellement à la recherche.
8. **Garde un plafond de page.** La valeur par défaut n'empêche pas un client de demander
   une page énorme; `LIMIT_MAX` borne cette demande à 100 éléments.
9. **Mongoose a des règles distinctes pour création et mise à jour.** Les options
   `new: true` et `runValidators: true` dans le service capteur évitent respectivement de
   renvoyer l'ancien document et d'ignorer les validations pendant une mise à jour.
10. **Distingue les catégories d'erreurs.** Une entrée invalide est une erreur client
    (`400`); un identifiant valide sans document correspondant mène à `404`; une collision
    d'identifiant capteur mène à `409`; une panne non classée passe en `500`.
11. **La page statique n'est pas le tableau de bord complet.** Les opérations de supervision
    sont actuellement démontrées par l'API et les journaux console.
12. **Le champ `active` existe, mais n'est pas consulté dans le démarrage du simulateur
    actuel.** `index.js` vérifie l'existence du capteur et utilise ses bornes; il ne vérifie
    pas `active`.
13. **Les paramètres invalides de filtre ne produisent pas tous une erreur HTTP.** Dans
    `buildFilter`, une borne numérique ou une date invalide est ignorée; un tri inconnu
    revient au défaut; une page ou limite non entière/invalide revient à sa valeur par
    défaut. Il faut préserver ce comportement ou décider explicitement de le changer.
14. **N'invente pas de fonctionnalité à partir d'un module isolé.** `stats.js` calcule des
    statistiques en mémoire, mais la route utilise une agrégation MongoDB. Les tester ou
    les modifier demande de suivre leur usage réel.

## 10. Méthode de réflexion pour réécrire correctement

Réécrire « proprement » commence par préserver le comportement attendu, pas par renommer
ou déplacer des fichiers au hasard. Procède dans cet ordre :

### Étape A — Établir le contrat avant de coder

- Lister les déclencheurs externes : commandes de démarrage, routes HTTP et événements du
  simulateur.
- Pour chaque route, relever méthode, chemin, paramètres, validation, code de réponse et
  forme JSON. Inclure les cas absents et invalides, pas seulement le cas heureux.
- Écrire le format d'une mesure (`sensor`, `value`, `createdAt`) et qui est responsable
  de l'émettre, de la stocker et de l'interpréter.
- Établir les champs et règles des documents MongoDB avant de modifier les schémas.

### Étape B — Dessiner les flux et les frontières

- Séparer le flux d'initialisation du flux d'une requête HTTP et du flux d'acquisition
  périodique.
- Tracer les appels jusqu'à leurs effets : écriture MongoDB, lecture, réponse HTTP,
  journal ou émission d'événement.
- Garder des frontières simples : transport HTTP dans les routes/contrôleurs, persistance
  dans les services/modèles, règles de requête dans les fonctions pures.
- Repérer les modules qui semblent inutilisés dans le flux principal (`stats.js`, par
  exemple) avant de les supprimer; chercher leurs imports et tests.

### Étape C — Réimplémenter dans un ordre qui réduit les inconnues

1. Définir le modèle et ses validations, puis écrire les tests des contraintes.
2. Écrire les fonctions pures de filtre, tri et pagination, avec des tests indépendants
   de MongoDB.
3. Implémenter les services à partir de ces contrats et vérifier la cohérence du filtre,
   du tri, de la pagination et du décompte.
4. Brancher les contrôleurs et préciser les réponses HTTP pour succès, absence, validation
   et erreurs.
5. Déclarer les routes et vérifier leur ordre, surtout les routes fixes et paramétrées.
6. Composer les middlewares et l'application Express.
7. Relier enfin la connexion MongoDB, le simulateur, le moniteur et le serveur dans le
   point d'entrée.
8. Tester le script seed séparément : il modifie réellement la base et n'est pas un test
   hors ligne.

### Étape D — Comparer au comportement d'origine

Pour chaque élément du contrat, demander : « Quel test ou quelle observation prouve que
ce comportement existe encore ? » Vérifier au minimum :

- démarrage avec et sans `MONGO_URI`, puis avec et sans le capteur `temp-b127`;
- génération périodique, persistance, seuil dépassé et valeur exactement égale au seuil;
- réponses CRUD capteur, erreurs de validation et identifiant dupliqué;
- lecture mesure, mesure absente, `ObjectId` mal formé, statistiques et population capteur;
- combinaisons de filtres, valeurs invalides, tri, limites de page et forme de la réponse;
- middleware 404 et gestion des erreurs.

Exécuter d'abord `npm test`, car ces deux suites ne nécessitent pas MongoDB. Tester ensuite
les flux dépendants de la base avec une configuration de test contrôlée. Ne lancer
`npm run seed` qu'en sachant quelle base est configurée : il insère des données
persistantes.

### Étape E — Refactoriser après l'équivalence

Une fois les mêmes contrats vérifiés, améliorer une seule frontière à la fois. À chaque
changement, conserver ou ajouter un test qui montre la règle préservée. Ne mélange pas
dans un même changement la refonte des réponses HTTP, du modèle de données, du simulateur
et du routage : si un test échoue, il deviendrait difficile de savoir quelle décision a
causé la régression.

## 11. Limites observables à connaître

Cette liste décrit le code actuel; elle ne signifie pas que chaque point doit être changé
pour l'exercice :

- Le serveur dépend de MongoDB pour démarrer et il n'expose pas de contrôle de santé
  séparé.
- L'identifiant du simulateur est fixé dans `index.js` à `temp-b127`.
- Le champ `active` ne conditionne pas le lancement du simulateur.
- Les alertes sont seulement écrites dans la console.
- Le client web sert une page statique et n'affiche pas la liste des mesures.
- L'API ne déclare pas de mécanisme d'authentification dans les routes examinées.
- Les erreurs de filtre numériques ou de date sont ignorées plutôt que signalées comme
  invalides.
- Le script de seed exige une connexion et insère des documents persistants.
- Les tests présents couvrent les schémas et les fonctions de requête; ils ne démarrent
  pas Express et ne valident pas une instance MongoDB réelle.