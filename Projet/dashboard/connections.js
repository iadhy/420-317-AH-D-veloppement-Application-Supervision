/**
 * Les connexions entre le tableau de bord et le serveur.
 *
 * C'est le SEUL fichier a ecrire cote tableau de bord : src/public/connections.js.
 * Tout le reste (dashboard.js, index.html, style.css) est fourni et ne change pas : il appelle
 * les fonctions ci-dessous et ne sait rien de l'adresse des routes ni du nom des evenements.
 *
 * Neuf TODO, dans cet ordre, tous dans CE fichier :
 *   REST   : 1 connexion, 2 liste des capteurs, 3 mesures, 4 statistiques, 5 creation
 *   SOCKET : 6 ouverture, 7 etat de la connexion, 8 mesures et alertes, 9 capteurs
 *
 * Ou trouver les reponses : le README de votre serveur contient le tableau des routes (methode,
 * chemin, role) et le tableau des evenements Socket.IO (nom, contenu). Les noms sont a copier
 * tels quels : une lettre de travers et rien ne se passe, sans erreur.
 *
 * Tant qu'un TODO n'est pas fait, la page affiche son message d'erreur : c'est voulu,
 * cela vous dit ou vous en etes.
 */

// ---------------------------------------------------------------------------
// FOURNI : le jeton et la fonction api(). Rien a modifier.
// ---------------------------------------------------------------------------

const TOKEN_KEY = "token";

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}
export function saveToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

let sessionExpiredHandler = () => {};
/** dashboard.js y inscrit ce qu'il faut faire quand le serveur repond 401. */
export function onSessionExpired(handler) {
  sessionExpiredHandler = handler;
}

/**
 * Appelle l'API et retourne le JSON recu.
 *   api("/chemin")                                   -> GET
 *   api("/chemin", { method: "POST", body: {...} })  -> envoie body en JSON
 *
 * Elle ajoute l'en-tete Authorization quand un jeton existe, et leve une Error dont le
 * message est lisible par l'utilisateur : celui du serveur ({ error } ou { errors: [...] }).
 * Un 401 avec jeton signifie que la session a expire : le tableau de bord revient a la
 * connexion.
 */
async function api(path, { method = "GET", body } = {}) {
  const token = getToken();
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 401 && token) {
    sessionExpiredHandler();
    throw new Error("Session expiree, reconnectez-vous");
  }

  const content = await response.json().catch(() => ({})); // un 204 n'a pas de corps
  if (!response.ok) {
    throw new Error(content.errors?.join(", ") ?? content.error ?? `Erreur ${response.status}`);
  }
  return content;
}

// ---------------------------------------------------------------------------
// REST : cinq fonctions a ecrire avec api()
//
// Rappel de api(chemin, { method, body }) : elle retourne le JSON deja decode (un objet ou
// un tableau JavaScript, pas du texte) et leve une Error si le serveur refuse.
// ---------------------------------------------------------------------------

/**
 * TODO 1 : se connecter.
 *
 * Appelle la route de connexion du serveur.
 *
 * @param {string} email     le courriel saisi
 * @param {string} password  le mot de passe saisi
 * @returns {Promise<{ token: string, user: { id: string, email: string, role: string } }>}
 *          la reponse du serveur, TELLE QUELLE (ne retournez pas seulement le jeton :
 *          dashboard.js lit response.token).
 * @throws  Error("Identifiants invalides") si le serveur refuse : api() s'en charge.
 *
 * Exemple de valeur retournee :
 *   { token: "eyJhbGciOi...", user: { id: "665f...", email: "a@b.ca", role: "operator" } }
 *
 * Attention : le serveur attend les champs "email" et "password" dans le corps JSON.
 */
export async function login(email, password) {
  throw new Error("TODO 1 : login n'est pas encore ecrite (connections.js)");
}

/**
 * TODO 2 : la liste des capteurs.
 *
 * @returns {Promise<Array<{
 *   _id: string, name: string, unit: string, min: number, max: number,
 *   threshold: number, direction: "above" | "below", active: boolean
 * }>>}  un TABLEAU de capteurs, tous les capteurs (actifs ou non).
 *
 * Exemple de valeur retournee :
 *   [ { _id: "temp-b127", name: "Salle A", unit: "C", min: 0, max: 50,
 *       threshold: 28, direction: "above", active: true } ]
 *
 * Ne filtrez rien : dashboard.js garde lui-meme les capteurs actifs.
 */
export async function loadSensors() {
  throw new Error("TODO 2 : loadSensors n'est pas encore ecrite (connections.js)");
}

/**
 * TODO 3 : les dernieres mesures d'UN capteur.
 *
 * @param {string} sensorId  l'identifiant du capteur, par exemple "temp-b127"
 * @param {object} options
 * @param {number} options.limit  nombre de mesures voulues (toujours fourni)
 * @param {number} [options.min]  garder les valeurs >= min (undefined : pas de borne)
 * @param {number} [options.max]  garder les valeurs <= max (undefined : pas de borne)
 * @returns {Promise<Array<{ _id: string, value: number, createdAt: string }>>}
 *          un TABLEAU de mesures, la plus RECENTE en premier (c'est l'ordre du serveur).
 *
 * Exemple de valeur retournee :
 *   [ { _id: "6650...", value: 24.3, createdAt: "2026-10-14T16:02:11.000Z" },
 *     { _id: "6650...", value: 24.1, createdAt: "2026-10-14T16:02:09.000Z" } ]
 *
 * La route ne renvoie PAS ce tableau directement : elle renvoie un objet
 *   { data: [ ...les mesures... ], pagination: { page, limit, total, pages } }
 * Il faut donc retourner la propriete "data", et rien d'autre.
 *
 * Deux pieges :
 *   - n'ajoutez min ou max a l'adresse QUE s'il est defini. Un "?min=" vide est lu comme 0
 *     par le serveur et filtre les valeurs negatives sans prevenir ;
 *   - construisez l'adresse avec URLSearchParams, pas avec des morceaux de texte colles.
 *
 * Les noms des parametres de la route (capteur, limite, bornes) sont dans le README du serveur,
 * section sur les filtres. Le serveur plafonne la limite a 100.
 */
export async function loadMeasures(sensorId, { min, max, limit } = {}) {
  throw new Error("TODO 3 : loadMeasures n'est pas encore ecrite (connections.js)");
}

/**
 * TODO 4 : les statistiques d'UN capteur.
 *
 * @param {string} sensorId  l'identifiant du capteur
 * @returns {Promise<{ count: number, min: number | null, max: number | null, average: number | null }>}
 *          un OBJET, calcule par le serveur pour ce seul capteur. Le tableau de bord
 *          n'additionne rien lui-meme.
 *
 * Exemple de valeur retournee :
 *   { count: 142, min: 18.2, max: 31.9, average: 24.67 }
 * Capteur sans mesure : { count: 0, min: null, max: null, average: null }
 *
 * Attention : sans l'identifiant du capteur dans l'adresse, le serveur calcule les statistiques
 * de TOUTES les mesures, tous capteurs confondus.
 */
export async function loadStatistics(sensorId) {
  throw new Error("TODO 4 : loadStatistics n'est pas encore ecrite (connections.js)");
}

/**
 * TODO 5 : creer un capteur.
 *
 * @param {{ id: string, name: string, unit: string, min: number, max: number,
 *           threshold: number, direction: "above" | "below" }} sensor
 *        deja au bon format (nombres, pas du texte) : envoyez-le tel quel dans le corps JSON.
 * @returns {Promise<object>}  le capteur cree, tel que repondu par le serveur
 *          (avec son champ "_id", pas "id").
 * @throws  Error dont le message vient du serveur (400 donnee invalide, 403 role insuffisant,
 *          409 identifiant deja utilise) : api() s'en charge, dashboard.js l'affiche sous le
 *          formulaire. Vous n'avez rien a ajouter.
 *
 * Ne creez PAS la carte vous-meme apres la reponse : le serveur annonce la creation a
 * tous les navigateurs par un evenement (voir TODO 9), le votre compris.
 */
export async function createSensor(sensor) {
  throw new Error("TODO 5 : createSensor n'est pas encore ecrite (connections.js)");
}

// ---------------------------------------------------------------------------
// SOCKET : quatre fonctions a ecrire avec la variable globale io()
//
// Une fonction "bind" ne RETOURNE rien : elle inscrit des ecouteurs avec socket.on(nom, fonction)
// et c'est tout. Les fonctions a appeler (handlers.xxx) sont deja ecrites dans dashboard.js.
// Le nom d'un evenement est un TEXTE copie du README du serveur, par exemple "measure".
// ---------------------------------------------------------------------------

/**
 * TODO 6 : ouvrir la connexion Socket.IO.
 *
 * @param {string} token  le jeton JWT obtenu a la connexion
 * @returns {Socket}  le socket retourne par io(), tel quel
 *
 * io() est fourni par le script /socket.io/socket.io.js, que le serveur sert lui-meme
 * (voir index.html) : c'est une variable globale, rien a importer. Le serveur refuse toute
 * connexion sans jeton : transmettez-le dans l'option "auth", sous le nom "token".
 */
export function openSocket(token) {
  throw new Error("TODO 6 : openSocket n'est pas encore ecrite (connections.js)");
}

/**
 * TODO 7 : suivre l'etat de la connexion.
 *
 * @param {Socket} socket  le socket du TODO 6
 * @param {{ connected: () => void, disconnected: () => void, refused: (message: string) => void }} handlers
 * @returns {void}
 *
 * Inscrivez un ecouteur pour chacun des trois evenements d'etat de Socket.IO :
 *
 *   evenement Socket.IO  | quand                                    | appelez
 *   ---------------------+------------------------------------------+---------------------------
 *   "connect"            | la connexion reussit (aussi apres une    | handlers.connected()
 *                        | coupure)                                 |
 *   "disconnect"         | la connexion tombe                       | handlers.disconnected()
 *   "connect_error"      | une tentative echoue (recoit une erreur) | handlers.refused(error.message)
 *
 * Ces trois noms sont fixes, propres a Socket.IO : ils ne sont pas dans le README du serveur
 * mais dans la documentation de la bibliotheque. "connected" et "disconnected" n'ont aucun
 * parametre; "refused" recoit le TEXTE de l'erreur (error.message), pas l'objet Error.
 */
export function bindConnection(socket, handlers) {
  throw new Error("TODO 7 : bindConnection n'est pas encore ecrite (connections.js)");
}

/**
 * TODO 8 : ecouter les mesures et les alertes.
 *
 * @param {Socket} socket
 * @param {{ measure: (m: object) => void, alert: (a: object) => void, recovery: (r: object) => void }} handlers
 * @returns {void}
 *
 * Inscrivez un ecouteur pour chacun des trois evenements que le serveur diffuse (leurs noms
 * sont dans le tableau des evenements du README du serveur). Chaque fonction de "handlers"
 * recoit directement le contenu de l'evenement, sans transformation :
 *
 *   evenement du serveur   | contenu (un objet)                                         | appelez
 *   -----------------------+------------------------------------------------------------+------------------
 *   une nouvelle mesure    | { _id, sensor: "temp-b127", value: 24.3, createdAt }       | handlers.measure
 *   un capteur passe en    | { sensor: "temp-b127", value: 31.2, threshold: 28,         | handlers.alert
 *   alerte                 |   direction: "above", createdAt }                          |
 *   un capteur redevient   | meme forme que l'alerte                                    | handlers.recovery
 *   normal                 |                                                            |
 *
 * Remarque : dans l'evenement, "sensor" est l'identifiant (un texte). Dans la reponse REST du
 * TODO 3, c'est un objet. Ne les melangez pas : dashboard.js sait deja lequel il recoit.
 */
export function bindMeasures(socket, handlers) {
  throw new Error("TODO 8 : bindMeasures n'est pas encore ecrite (connections.js)");
}

/**
 * TODO 9 : ecouter les changements de capteurs.
 *
 * @param {Socket} socket
 * @param {{ created: (s: object) => void, updated: (s: object) => void, deleted: (p: { id: string }) => void }} handlers
 * @returns {void}
 *
 * Le serveur annonce chaque changement fait par l'API, y compris ceux des autres
 * utilisateurs. Inscrivez un ecouteur pour chacun des trois evenements (noms dans le README
 * du serveur). Chaque fonction de "handlers" recoit directement le contenu :
 *
 *   evenement du serveur  | contenu                                              | appelez
 *   ----------------------+------------------------------------------------------+------------------
 *   un capteur est cree   | le capteur : { _id, name, unit, ..., active }        | handlers.created
 *   un capteur est modifie| le capteur a jour, meme forme (activation et seuil   | handlers.updated
 *   (dont activer et      |   compris)                                           |
 *   desactiver)           |                                                      |
 *   un capteur est        | seulement l'identifiant : { id: "temp-b127" }        | handlers.deleted
 *   supprime              |                                                      |
 */
export function bindSensors(socket, handlers) {
  throw new Error("TODO 9 : bindSensors n'est pas encore ecrite (connections.js)");
}
