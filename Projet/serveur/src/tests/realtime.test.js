/**
 * Tests du temps reel, executables SANS connexion a MongoDB.
 *
 *  - Monitor : n'emet qu'aux changements d'etat (alert, puis recovery).
 *  - Socket : sans jeton valide, la connexion est refusee ; avec un jeton,
 *    le client recoit ce que le serveur diffuse.
 *
 * Le pipeline complet (enregistrer, diffuser, surveiller) a besoin de la
 * base : il se verifie avec la page /live.html.
 *
 * Lancer avec : npm test
 */
import assert from "assert";
import http from "http";
import jwt from "jsonwebtoken";
import { io as connecter } from "socket.io-client";

process.env.JWT_SECRET = "secret-de-test";

const { Monitor } = await import("../monitor.js");
const { initRealtime, emit } = await import("../realtime.js");

let passed = 0;
async function test(nom, fn) {
  await fn();
  passed += 1;
  console.log(`  ok  ${nom}`);
}

// ---------------------------------------------------------------- Monitor
console.log("\nMonitor");

const mesure = (value) => ({ sensor: "t1", value, createdAt: new Date() });
const above = { threshold: 28, direction: "above" };
const below = { threshold: 3, direction: "below" };

function espionner(monitor) {
  const recus = [];
  monitor.on("alert", (e) => recus.push(["alert", e]));
  monitor.on("recovery", (e) => recus.push(["recovery", e]));
  return recus;
}

await test("pas d'evenement tant que la mesure reste normale", () => {
  const monitor = new Monitor();
  const recus = espionner(monitor);
  monitor.check(mesure(20), above);
  monitor.check(mesure(25), above);
  assert.strictEqual(recus.length, 0);
});

await test("depasser le seuil emet UNE alerte", () => {
  const monitor = new Monitor();
  const recus = espionner(monitor);
  monitor.check(mesure(20), above);
  monitor.check(mesure(29), above);
  assert.deepStrictEqual(recus.map(([nom]) => nom), ["alert"]);
  assert.strictEqual(recus[0][1].threshold, 28);
  assert.strictEqual(recus[0][1].value, 29);
});

await test("rester au-dessus du seuil n'emet rien de plus", () => {
  const monitor = new Monitor();
  const recus = espionner(monitor);
  for (const v of [29, 30, 31, 32]) monitor.check(mesure(v), above);
  assert.strictEqual(recus.length, 1);
});

await test("revenir sous le seuil emet recovery", () => {
  const monitor = new Monitor();
  const recus = espionner(monitor);
  monitor.check(mesure(29), above);
  monitor.check(mesure(27), above);
  assert.deepStrictEqual(recus.map(([nom]) => nom), ["alert", "recovery"]);
});

await test("la valeur exactement egale au seuil n'est pas une alerte", () => {
  const monitor = new Monitor();
  const recus = espionner(monitor);
  monitor.check(mesure(28), above);
  assert.strictEqual(recus.length, 0);
});

await test("direction below : alerte en descendant sous le seuil", () => {
  const monitor = new Monitor();
  const recus = espionner(monitor);
  monitor.check(mesure(3.2), below);
  monitor.check(mesure(2.9), below);
  assert.deepStrictEqual(recus.map(([nom]) => nom), ["alert"]);
});

await test("chaque capteur a son propre etat", () => {
  const monitor = new Monitor();
  const recus = espionner(monitor);
  monitor.check({ sensor: "a", value: 30, createdAt: new Date() }, above);
  monitor.check({ sensor: "b", value: 30, createdAt: new Date() }, above);
  assert.strictEqual(recus.length, 2);
});

// ----------------------------------------------------------------- Socket
console.log("\nSocket");

const serveur = http.createServer();
initRealtime(serveur);
await new Promise((resolve) => serveur.listen(0, resolve));
const url = `http://127.0.0.1:${serveur.address().port}`;

const jeton = (options = {}) =>
  jwt.sign({ id: "u1", role: "reader" }, options.secret || process.env.JWT_SECRET, {
    expiresIn: options.expiresIn || "1h",
  });

function seConnecter(token) {
  const client = connecter(url, { auth: { token }, reconnection: false, forceNew: true });
  return new Promise((resolve) => {
    client.on("connect", () => resolve({ client, ok: true }));
    client.on("connect_error", (erreur) => resolve({ client, ok: false, message: erreur.message }));
  });
}

await test("sans jeton : connexion refusee", async () => {
  const { client, ok, message } = await seConnecter(undefined);
  assert.strictEqual(ok, false);
  assert.strictEqual(message, "Jeton absent ou invalide");
  client.close();
});

await test("jeton falsifie : connexion refusee", async () => {
  const { client, ok } = await seConnecter("n-importe-quoi");
  assert.strictEqual(ok, false);
  client.close();
});

await test("jeton signe avec un autre secret : connexion refusee", async () => {
  const { client, ok } = await seConnecter(jeton({ secret: "pirate" }));
  assert.strictEqual(ok, false);
  client.close();
});

await test("jeton expire : connexion refusee", async () => {
  const { client, ok } = await seConnecter(jeton({ expiresIn: -10 }));
  assert.strictEqual(ok, false);
  client.close();
});

await test("jeton valide : connecte, et recoit les diffusions du serveur", async () => {
  const { client, ok } = await seConnecter(jeton());
  assert.strictEqual(ok, true);

  const recu = new Promise((resolve) => client.on("sensor:created", resolve));
  emit("sensor:created", { _id: "t1", name: "Temperature" });
  assert.deepStrictEqual(await recu, { _id: "t1", name: "Temperature" });
  client.close();
});

await test("tous les clients connectes recoivent la diffusion", async () => {
  const a = await seConnecter(jeton());
  const b = await seConnecter(jeton());
  const attendre = (c) => new Promise((resolve) => c.client.on("alert", resolve));
  const [ra, rb] = [attendre(a), attendre(b)];
  emit("alert", { sensor: "t1", value: 30 });
  assert.strictEqual((await ra).value, 30);
  assert.strictEqual((await rb).value, 30);
  a.client.close();
  b.client.close();
});

console.log(`\n${passed} tests reussis\n`);
serveur.close();
process.exit(0);
