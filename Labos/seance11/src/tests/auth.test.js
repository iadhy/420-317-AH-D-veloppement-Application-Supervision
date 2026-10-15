/**
 * Tests de securite, executables SANS connexion a MongoDB.
 *
 * Chaque requete testee est arretee AVANT de toucher la base : jeton absent
 * (401), role insuffisant (403), corps invalide (400), corps trop gros (413).
 * C'est aussi la preuve que protect et authorize sont bien en amont.
 *
 * Ce qui exige la base (inscription, connexion reussie, suppression par un
 * admin) se verifie a la main avec Thunder Client.
 *
 * Lancer avec : npm test
 */
import assert from "assert";
import jwt from "jsonwebtoken";

// Ces variables doivent exister AVANT l'import de l'application.
process.env.JWT_SECRET = "secret-de-test";
process.env.CORS_ORIGIN = "http://localhost:5500";

const { default: app } = await import("../app.js");
const { default: User } = await import("../models/user.model.js");

const server = app.listen(0);
const base = `http://127.0.0.1:${server.address().port}`;

const jeton = (role, options = {}) =>
  jwt.sign({ id: "u1", role }, options.secret || process.env.JWT_SECRET, {
    expiresIn: options.expiresIn || "1h",
  });

async function appeler(methode, chemin, { token, body, headers } = {}) {
  const reponse = await fetch(base + chemin, {
    method: methode,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: typeof body === "string" ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });
  const texte = await reponse.text();
  let json = null;
  try { json = JSON.parse(texte); } catch { /* reponse vide */ }
  return { status: reponse.status, json, headers: reponse.headers };
}

let passed = 0;
async function test(nom, fn) {
  await fn();
  passed += 1;
  console.log(`  ok  ${nom}`);
}

console.log("\nSchema User");

await test("le role par defaut est reader", () => {
  const user = new User({ email: "a@b.ca", password: "motdepasse" });
  assert.strictEqual(user.role, "reader");
});

await test("refuse un role inconnu", () => {
  const erreur = new User({ email: "a@b.ca", password: "x", role: "superadmin" }).validateSync();
  assert.ok(erreur.errors.role);
});

await test("le courriel est mis en minuscules", () => {
  assert.strictEqual(new User({ email: "  Alice@B.CA ", password: "x" }).email, "alice@b.ca");
});

await test("le hash n'est pas renvoye par defaut (select: false)", () => {
  assert.strictEqual(User.schema.path("password").options.select, false);
});

console.log("\nAuthentification : 401");

await test("sans jeton : 401 sur les capteurs", async () => {
  const r = await appeler("GET", "/api/sensors");
  assert.strictEqual(r.status, 401);
  assert.strictEqual(r.json.error, "Jeton absent");
});

await test("sans jeton : 401 sur les mesures", async () => {
  assert.strictEqual((await appeler("GET", "/api/measures")).status, 401);
  assert.strictEqual((await appeler("GET", "/api/measures/latest")).status, 401);
  assert.strictEqual((await appeler("GET", "/api/measures/stats")).status, 401);
});

await test("jeton falsifie : 401", async () => {
  const r = await appeler("GET", "/api/sensors", { token: "n-importe-quoi" });
  assert.strictEqual(r.status, 401);
});

await test("jeton signe avec un autre secret : 401", async () => {
  const r = await appeler("GET", "/api/sensors", { token: jeton("admin", { secret: "pirate" }) });
  assert.strictEqual(r.status, 401);
});

await test("jeton expire : 401", async () => {
  const r = await appeler("GET", "/api/sensors", { token: jeton("admin", { expiresIn: -10 }) });
  assert.strictEqual(r.status, 401);
});

console.log("\nAutorisation : 403");

await test("reader ne peut pas creer un capteur : 403", async () => {
  const r = await appeler("POST", "/api/sensors", { token: jeton("reader"), body: {} });
  assert.strictEqual(r.status, 403);
  assert.strictEqual(r.json.error, "Acces refuse");
});

await test("reader ne peut pas modifier un capteur : 403", async () => {
  const r = await appeler("PUT", "/api/sensors/t1", { token: jeton("reader"), body: {} });
  assert.strictEqual(r.status, 403);
});

await test("reader ne peut pas supprimer un capteur : 403", async () => {
  assert.strictEqual((await appeler("DELETE", "/api/sensors/t1", { token: jeton("reader") })).status, 403);
});

await test("operator ne peut pas supprimer un capteur : 403", async () => {
  assert.strictEqual((await appeler("DELETE", "/api/sensors/t1", { token: jeton("operator") })).status, 403);
});

await test("operator passe authorize : le corps invalide donne 400, pas 403", async () => {
  const r = await appeler("POST", "/api/sensors", { token: jeton("operator"), body: {} });
  assert.strictEqual(r.status, 400);
});

await test("authorize passe avant la validation : reader + corps invalide = 403", async () => {
  const r = await appeler("POST", "/api/sensors", { token: jeton("reader"), body: {} });
  assert.strictEqual(r.status, 403);
});

console.log("\nDurcissement");

await test("helmet : en-tetes de securite presents, X-Powered-By retire", async () => {
  const r = await appeler("GET", "/api/sensors");
  assert.strictEqual(r.headers.get("x-content-type-options"), "nosniff");
  assert.ok(r.headers.get("content-security-policy"));
  assert.strictEqual(r.headers.get("x-powered-by"), null);
});

await test("corps de plus de 10 ko : 413 en JSON", async () => {
  const r = await appeler("POST", "/api/auth/register", { body: { email: "a@b.ca", password: "x".repeat(20_000) } });
  assert.strictEqual(r.status, 413);
  assert.ok(r.json.error);
});

await test("JSON malforme : 400 en JSON", async () => {
  const r = await appeler("POST", "/api/auth/login", { body: '{ "email": }' });
  assert.strictEqual(r.status, 400);
  assert.ok(r.json.error);
});

await test("CORS : l'origine configuree est annoncee", async () => {
  const r = await appeler("GET", "/api/sensors", { headers: { Origin: "http://localhost:5500" } });
  assert.strictEqual(r.headers.get("access-control-allow-origin"), "http://localhost:5500");
});

await test("CORS : la pre-verification OPTIONS passe sans jeton", async () => {
  const r = await appeler("OPTIONS", "/api/sensors", {
    headers: {
      Origin: "http://localhost:5500",
      "Access-Control-Request-Method": "GET",
      "Access-Control-Request-Headers": "authorization",
    },
  });
  assert.strictEqual(r.status, 204);
});

await test("inscription : un mot de passe trop court est refuse (400)", async () => {
  const r = await appeler("POST", "/api/auth/register", { body: { email: "a@b.ca", password: "court" } });
  assert.strictEqual(r.status, 400);
  assert.ok(Array.isArray(r.json.errors));
});

// En dernier : ce test consomme le quota de tentatives de connexion.
await test("connexion : la 6e tentative en une minute est bloquee (429)", async () => {
  const statuts = [];
  for (let i = 0; i < 6; i += 1) {
    const r = await appeler("POST", "/api/auth/login", { body: {} });
    statuts.push(r.status);
    if (i === 5) assert.ok(r.json.error, "le message du 429 doit etre du JSON");
  }
  assert.ok(statuts.slice(0, 5).every((s) => s === 400), `5 premieres: ${statuts}`);
  assert.strictEqual(statuts[5], 429);
});

console.log(`\n${passed} tests reussis\n`);
server.close();
process.exit(0);
