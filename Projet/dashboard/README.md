# Tableau de bord du projet final

Le tableau de bord est **fourni complet**, sauf les connexions avec le serveur. C'est votre travail,
et il tient dans **un seul fichier**.

## Les quatre fichiers

| Fichier | Rôle | Vous y touchez ? |
|---|---|---|
| `connections.js` | les 9 connexions avec le serveur | **oui, c'est le seul** |
| `dashboard.js` | tout l'affichage (cartes, graphique, tableau, statistiques, formulaire) | non |
| `index.html` | la page | non |
| `style.css` | l'apparence | non |

Si quelque chose ne s'affiche pas, le défaut est dans `connections.js`, dans le serveur ou dans
un nom copié de travers, jamais dans les trois autres fichiers.

## Installer

1. Copiez les quatre fichiers dans `src/public/` de votre serveur (remplacez ceux du même nom).
2. Installez Chart.js : `npm install chart.js`.
3. Dans `src/app.js`, juste après `app.use(express.static("src/public"));`, ajoutez :

   ```js
   app.use("/vendor", express.static("node_modules/chart.js/dist"));
   ```

   Le navigateur charge Chart.js depuis votre serveur parce que la politique de `helmet`
   refuse les scripts de CDN.
4. Lancez le serveur et ouvrez `http://localhost:3000/`.

## Les 9 TODO : tous dans `src/public/connections.js`

Cherchez `TODO 1`, `TODO 2`, etc. dans ce fichier. Chacun est une fonction dont le commentaire
dit ce qu'elle reçoit et ce qu'elle doit retourner. Vous pouvez utiliser la fonction `api()`
déjà écrite au début du fichier pour tous les appels REST.

| TODO | Fichier | Fonction | À faire |
|---|---|---|---|
| 1 | `src/public/connections.js` | `login(email, password)` | appeler la route de connexion, retourner la réponse (qui contient le jeton) |
| 2 | `src/public/connections.js` | `loadSensors()` | appeler la route qui liste les capteurs, retourner le tableau |
| 3 | `src/public/connections.js` | `loadMeasures(sensorId, { min, max, limit })` | appeler la route des mesures avec le capteur, la limite et les bornes, retourner le tableau `data` |
| 4 | `src/public/connections.js` | `loadStatistics(sensorId)` | appeler la route des statistiques pour ce capteur, retourner `{ count, min, max, average }` |
| 5 | `src/public/connections.js` | `createSensor(sensor)` | appeler la route de création d'un capteur, retourner le capteur créé |
| 6 | `src/public/connections.js` | `openSocket(token)` | ouvrir le socket en transmettant le jeton, retourner le socket |
| 7 | `src/public/connections.js` | `bindConnection(socket, handlers)` | brancher les 3 événements d'état de la connexion (réussie, perdue, refusée) |
| 8 | `src/public/connections.js` | `bindMeasures(socket, handlers)` | brancher les événements de mesure, d'alerte et de retour à la normale |
| 9 | `src/public/connections.js` | `bindSensors(socket, handlers)` | brancher les événements de création, de modification et de suppression d'un capteur |

Les TODO 1 à 5 sont des appels REST; les TODO 6 à 9 sont des écoutes Socket.IO.

### Où trouver les réponses

- les **chemins des routes** et les **rôles** : le tableau des routes dans le `README.md` de votre
  serveur;
- les **noms des événements Socket.IO** et leur contenu : le tableau des événements dans le même
  `README.md`;
- les noms d'événements d'état de la connexion (TODO 7) : la documentation de Socket.IO. Ils ne
  sont pas dans le README du serveur.

Copiez les noms **tels quels** : une lettre de travers et rien ne se passe, sans message d'erreur.

## Avancer dans l'ordre

Tant qu'un TODO n'est pas fait, la page affiche son message d'erreur. C'est votre tableau de
progression : faites-les dans l'ordre et la page avance à chaque étape.

| Vous avez fait | Ce que vous voyez |
|---|---|
| rien | « TODO 1 : login n'est pas encore écrite » sous le formulaire de connexion |
| 1 | « TODO 6 » : le tableau de bord s'ouvre, le voyant est « Hors ligne » |
| 6 | « TODO 7 » |
| 7 | « Chargement impossible : TODO 2 » (le voyant passe à « En direct ») |
| 2 | un panneau par capteur actif, avec l'erreur du TODO 3 |
| 3 | les mesures s'affichent, avec l'erreur du TODO 4 |
| 4 | les statistiques s'affichent |
| 5 | le formulaire de création fonctionne (visible pour `operator` et `admin`) |
| 8 et 9 | tout est en direct, sans recharger la page |

## Ce que fait le tableau de bord

- un écran de connexion, puis un voyant « En direct » ou « Reconnexion... »;
- pour chaque capteur **actif** : dernière valeur, état (Normal ou Alerte), graphique des 20
  dernières mesures, statistiques (nombre, minimum, maximum, moyenne) et tableau des 20 dernières
  mesures;
- le tableau se filtre par les champs **min** et **max** (le serveur applique le filtre) et se
  trie en cliquant sur un en-tête;
- le tableau et les statistiques sont relus auprès du serveur à chaque nouvelle mesure;
- un formulaire de création de capteur, visible seulement pour les rôles `operator` et `admin`;
- un capteur désactivé disparaît, un capteur réactivé revient avec ses mesures, un capteur supprimé
  disparaît, sans recharger la page.
