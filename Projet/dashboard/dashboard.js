/**
 * Le tableau de bord : tout l'affichage. FOURNI, rien a modifier ici.
 *
 * Ce fichier ne sait pas COMMENT on parle au serveur : il appelle les fonctions de
 * connections.js (les TODO). Chaque appel est repere par un commentaire "connections.js".
 *
 * Regle de securite : tout ce qui vient du reseau (nom d'un capteur, valeur, message
 * d'erreur) est ecrit avec textContent. Jamais de HTML construit a partir d'une donnee :
 * le nom d'un capteur est saisi par quelqu'un, il pourrait contenir une balise.
 */
import {
  getToken, saveToken, clearToken, onSessionExpired,
  login, loadSensors, loadMeasures, loadStatistics, createSensor,
  openSocket, bindConnection, bindMeasures, bindSensors,
} from "/connections.js";

const MAX_POINTS = 20;        // taille du graphique et du tableau
const REFRESH_DELAY = 500;    // regroupe les rafraichissements d'un meme capteur (ms)

const loginSection = document.querySelector("#login");
const dashboardSection = document.querySelector("#dashboard");
const loginForm = document.querySelector("#login-form");
const loginError = document.querySelector("#login-error");
const statusLight = document.querySelector("#status");
const userLabel = document.querySelector("#user");
const sensorForm = document.querySelector("#sensor-form");
const sensorFormError = document.querySelector("#sensor-form-error");
const statusMessage = document.querySelector("#message");
const sensorsContainer = document.querySelector("#sensors");
const emptyMessage = document.querySelector("#empty");

let socket = null;
let generation = 0;          // change a chaque rechargement complet : ecarte les reponses perimees
const cards = new Map();     // identifiant du capteur -> carte (voir createCard)

// ----------------------------------------------------------------- Messages

function showMessage(text, isError = false) {
  statusMessage.textContent = text;
  statusMessage.className = isError ? "error" : "";
}

function updateEmpty() {
  emptyMessage.hidden = cards.size > 0;
}

function showDashboard(connected) {
  loginSection.hidden = connected;
  dashboardSection.hidden = !connected;
}

// Le role sert UNIQUEMENT a cacher le formulaire aux comptes qui n'y ont pas droit.
// La vraie verification est faite par le serveur (403) : rien ici n'est une protection.
function roleFromToken(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64)).role;
  } catch {
    return null;
  }
}

// ------------------------------------------------------------------ Etat

function isExceeded(sensor, value) {
  return sensor.direction === "above" ? value > sensor.threshold : value < sensor.threshold;
}

function showState(card, inAlert) {
  card.element.classList.toggle("alert", inAlert);
  card.state.textContent = inAlert ? `Alerte (seuil ${card.sensor.threshold})` : "Normal";
}

function showStatistics(card, stats) {
  card.stats.textContent = stats.count > 0
    ? `${stats.count} mesures, min ${stats.min}, max ${stats.max}, moyenne ${stats.average.toFixed(2)}`
    : "Aucune statistique";
}

function showTable(card) {
  const { field, order } = card.sort;
  const direction = order === "asc" ? 1 : -1;

  // Le tri porte sur ces vingt mesures, copiees : l'ordre recu du serveur n'est pas touche.
  const rows = [...card.measures].sort((a, b) =>
    field === "value"
      ? direction * (a.value - b.value)
      : direction * (new Date(a.createdAt) - new Date(b.createdAt)),
  );

  card.body.replaceChildren();
  if (rows.length === 0) {
    const cell = card.body.insertRow().insertCell();
    cell.colSpan = 2;
    cell.textContent = "Aucune mesure";
  }
  for (const measure of rows) {
    const row = card.body.insertRow();
    row.insertCell().textContent = new Date(measure.createdAt).toLocaleTimeString();
    row.insertCell().textContent = measure.value;
  }

  for (const button of card.element.querySelectorAll("thead button")) {
    const active = button.dataset.field === field;
    const arrow = active ? (order === "asc" ? " ▲" : " ▼") : "";
    button.textContent = button.dataset.label + arrow;
  }
}

// --------------------------------------------------------------- Les cartes

function readBound(input) {
  // Un champ vide donne undefined : loadMeasures ne doit alors rien envoyer.
  const text = input.value.trim();
  return text === "" || !Number.isFinite(Number(text)) ? undefined : Number(text);
}

function createCard(sensor) {
  const element = document.createElement("article");
  const title = document.createElement("h2");
  const value = document.createElement("p");
  const state = document.createElement("p");
  const stats = document.createElement("p");
  const chartArea = document.createElement("div");
  const canvas = document.createElement("canvas");
  const error = document.createElement("p");

  title.textContent = sensor.name;
  value.className = "value";
  value.textContent = "--";
  state.className = "state";
  stats.className = "stats";
  stats.textContent = "Chargement...";
  chartArea.className = "chart-area";
  chartArea.append(canvas);
  error.className = "card-error";
  error.setAttribute("role", "alert");

  // Les deux champs qui filtrent le tableau (par l'API, pas dans le navigateur).
  const filter = document.createElement("p");
  filter.className = "filter";
  const minInput = document.createElement("input");
  const maxInput = document.createElement("input");
  for (const input of [minInput, maxInput]) {
    input.type = "number";
    input.step = "any";
  }
  filter.append("Valeur min ", minInput, " max ", maxInput);

  const details = document.createElement("details");
  details.open = true;
  const summary = document.createElement("summary");
  summary.textContent = `${MAX_POINTS} dernieres mesures`;
  const table = document.createElement("table");
  const header = table.createTHead().insertRow();
  const body = table.createTBody();
  details.append(summary, filter, table);

  element.append(title, value, state, stats, error, chartArea, details);
  sensorsContainer.append(element);

  const chart = new Chart(canvas, {
    type: "line",
    data: {
      labels: [],
      datasets: [{ label: `${sensor.name} (${sensor.unit})`, data: [], borderColor: "#2e7d32" }],
    },
    // Sans animation : un graphique qui rebondit a chaque mesure fatigue l'oeil.
    options: { animation: false, maintainAspectRatio: false },
  });

  const card = {
    sensor, element, title, value, state, stats, error, chart, body, minInput, maxInput,
    measures: [],                                   // le contenu du tableau
    sort: { field: "createdAt", order: "desc" },
    lastValue: null,
    requestNumber: 0,                               // numero de la derniere requete du tableau
    timer: null,
  };

  for (const [field, label] of [["createdAt", "Heure"], ["value", "Valeur"]]) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.label = label;
    button.dataset.field = field;
    button.addEventListener("click", () => {
      const { sort } = card;
      // Meme colonne : on inverse. Autre colonne : la valeur du plus petit au plus grand,
      // l'heure du plus recent au plus ancien.
      const order = sort.field === field
        ? (sort.order === "desc" ? "asc" : "desc")
        : (field === "value" ? "asc" : "desc");
      card.sort = { field, order };
      showTable(card);
    });
    header.insertCell().append(button);
  }

  // Changer une borne relance la requete : le filtre est applique par le serveur.
  for (const input of [minInput, maxInput]) {
    input.addEventListener("change", () => refreshCard(card));
  }

  showTable(card);
  showState(card, false);
  cards.set(sensor._id, card);
  updateEmpty();
  return card;
}

function removeCard(id) {
  const card = cards.get(id);
  if (!card) return;
  clearTimeout(card.timer);
  card.chart.destroy();
  card.element.remove();
  cards.delete(id);
  updateEmpty();
}

// ------------------------------------------------------------ Les donnees

/**
 * Relit le tableau et les statistiques aupres du serveur.
 * Appelee au chargement, quand un filtre change, et apres chaque mesure recue.
 * Le numero de requete ecarte une reponse lente arrivee apres une plus recente.
 */
async function refreshCard(card) {
  const requestNumber = ++card.requestNumber;
  const id = card.sensor._id;
  try {
    const [measures, stats] = await Promise.all([
      // connections.js, TODO 3 et TODO 4
      loadMeasures(id, {
        min: readBound(card.minInput),
        max: readBound(card.maxInput),
        limit: MAX_POINTS,
      }),
      loadStatistics(id),
    ]);
    if (requestNumber !== card.requestNumber || cards.get(id) !== card) return;
    card.measures = measures;
    card.error.textContent = "";
    showTable(card);
    showStatistics(card, stats);
  } catch (e) {
    if (requestNumber !== card.requestNumber || cards.get(id) !== card) return;
    card.error.textContent = e.message;
  }
}

// Une rafale de mesures ne doit pas lancer une rafale de requetes : une seule par delai.
function scheduleRefresh(card) {
  if (card.timer) return;
  card.timer = setTimeout(() => {
    card.timer = null;
    refreshCard(card);
  }, REFRESH_DELAY);
}

function addPoint(card, measure) {
  const { labels, datasets } = card.chart.data;
  labels.push(new Date(measure.createdAt).toLocaleTimeString());
  datasets[0].data.push(measure.value);

  // Fenetre glissante : sans cette limite, la page ralentit puis devient illisible.
  if (labels.length > MAX_POINTS) {
    labels.shift();
    datasets[0].data.shift();
  }
  card.chart.update();

  card.lastValue = measure.value;
  card.value.textContent = `${measure.value.toFixed(1)} ${card.sensor.unit}`;
}

async function fillCard(card) {
  const id = card.sensor._id;
  try {
    // connections.js, TODO 3 : la reponse est triee de la plus RECENTE a la plus ancienne,
    // le graphique se lit de l'ancienne a la recente.
    const measures = await loadMeasures(id, { limit: MAX_POINTS });
    if (cards.get(id) !== card) return;
    for (const measure of [...measures].reverse()) addPoint(card, measure);

    // L'etat d'alerte n'est pas stocke : on le deduit de la derniere valeur.
    if (card.lastValue !== null) showState(card, isExceeded(card.sensor, card.lastValue));
  } catch (e) {
    if (cards.get(id) === card) card.error.textContent = e.message;
  }
  await refreshCard(card);
}

async function reloadAll() {
  const current = ++generation;
  showMessage("Chargement...");
  for (const id of [...cards.keys()]) removeCard(id);
  updateEmpty();

  try {
    const sensors = await loadSensors(); // connections.js, TODO 2
    if (current !== generation) return;
    const newCards = sensors.filter((s) => s.active).map(createCard);
    await Promise.all(newCards.map(fillCard));
    if (current === generation) showMessage("");
  } catch (e) {
    if (current === generation) showMessage(`Chargement impossible : ${e.message}`, true);
  }
}

// ------------------------------------------------- Ce que fait le socket

const connectionHandlers = {
  connected() {
    statusLight.textContent = "En direct";
    statusLight.className = "ok";
    // Apres une coupure, les mesures manquees ne reviennent pas : on recharge tout.
    reloadAll();
  },
  disconnected() {
    statusLight.textContent = "Reconnexion...";
    statusLight.className = "ko";
  },
  refused(text) {
    statusLight.textContent = "Reconnexion...";
    statusLight.className = "ko";
    if (text === "Jeton absent ou invalide") logout("Session expiree, reconnectez-vous");
  },
};

const measureHandlers = {
  measure(measure) {
    const card = cards.get(measure.sensor);
    if (!card) return;
    addPoint(card, measure);
    scheduleRefresh(card); // le tableau et les statistiques sont relus aupres du serveur
  },
  alert(alert) {
    const card = cards.get(alert.sensor);
    if (card) showState(card, true);
  },
  recovery(recovery) {
    const card = cards.get(recovery.sensor);
    if (card) showState(card, false);
  },
};

const sensorHandlers = {
  created(sensor) {
    if (!sensor.active || cards.has(sensor._id)) return;
    fillCard(createCard(sensor));
  },
  updated(sensor) {
    const card = cards.get(sensor._id);
    if (!sensor.active) return removeCard(sensor._id);   // desactive : il disparait
    if (!card) return fillCard(createCard(sensor));       // reactive : il revient avec son historique
    card.sensor = sensor;
    card.title.textContent = sensor.name;
    card.chart.data.datasets[0].label = `${sensor.name} (${sensor.unit})`;
    card.chart.update();
    if (card.lastValue !== null) showState(card, isExceeded(sensor, card.lastValue));
  },
  deleted({ id }) {
    removeCard(id);
  },
};

// --------------------------------------------------------------- Session

function start() {
  const token = getToken();
  showDashboard(true);
  showMessage("");
  const role = roleFromToken(token);
  userLabel.textContent = role ? `role : ${role}` : "";
  sensorForm.hidden = !["operator", "admin"].includes(role);

  statusLight.textContent = "Connexion...";
  statusLight.className = "";
  try {
    socket = openSocket(token);                      // connections.js, TODO 6
    bindConnection(socket, connectionHandlers);      // TODO 7
    bindMeasures(socket, measureHandlers);           // TODO 8
    bindSensors(socket, sensorHandlers);             // TODO 9
  } catch (e) {
    statusLight.textContent = "Hors ligne";
    statusLight.className = "ko";
    showMessage(e.message, true);
  }
}

function logout(text = "") {
  generation += 1;
  if (socket) socket.disconnect();
  socket = null;
  clearToken();
  for (const id of [...cards.keys()]) removeCard(id);
  updateEmpty();
  loginError.textContent = text;
  showDashboard(false);
}

onSessionExpired(() => logout("Session expiree, reconnectez-vous"));

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginError.textContent = "";
  try {
    const response = await login(                  // connections.js, TODO 1
      document.querySelector("#email").value,
      document.querySelector("#password").value,
    );
    saveToken(response.token);
    start();
  } catch (e) {
    loginError.textContent = e.message;
  }
});

sensorForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  sensorFormError.textContent = "";
  try {
    await createSensor({                            // connections.js, TODO 5
      id: document.querySelector("#sensor-id").value.trim(),
      name: document.querySelector("#sensor-name").value.trim(),
      unit: document.querySelector("#sensor-unit").value.trim(),
      min: Number(document.querySelector("#sensor-min").value),
      max: Number(document.querySelector("#sensor-max").value),
      threshold: Number(document.querySelector("#sensor-threshold").value),
      direction: document.querySelector("#sensor-direction").value,
    });
    sensorForm.reset();
  } catch (e) {
    sensorFormError.textContent = e.message;
  }
});

document.querySelector("#logout").addEventListener("click", () => logout());

if (getToken()) start();
