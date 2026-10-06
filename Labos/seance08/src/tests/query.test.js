/**
 * Tests des fonctions de construction de requete.
 * Aucune base de donnees necessaire : ce sont des fonctions pures.
 */
import assert from "assert";
import { buildFilter, buildSort } from "../utils/query.js";

let passed = 0;
function test(nom, fn) {
  fn();
  passed += 1;
  console.log(`  ok  ${nom}`);
}

console.log("\nbuildFilter");

test("sans parametre, le filtre est vide", () => {
  assert.deepStrictEqual(buildFilter({}), {});
});

test("filtre par capteur", () => {
  assert.deepStrictEqual(buildFilter({ sensor: "665f" }), { sensor: "665f" });
});

test("min est converti en nombre", () => {
  const filter = buildFilter({ min: "25" });
  assert.deepStrictEqual(filter.value, { $gte: 25 });
  assert.strictEqual(typeof filter.value.$gte, "number");
});

test("min et max forment un intervalle", () => {
  assert.deepStrictEqual(buildFilter({ min: "20", max: "25" }).value, { $gte: 20, $lte: 25 });
});

test("une valeur non numerique est ignoree", () => {
  assert.deepStrictEqual(buildFilter({ min: "vingt" }), {});
});

test("filtre par intervalle de dates", () => {
  const filter = buildFilter({ from: "2026-01-01", to: "2026-02-01" });
  assert.ok(filter.createdAt.$gte instanceof Date);
  assert.ok(filter.createdAt.$lte instanceof Date);
});

test("une date invalide est ignoree", () => {
  assert.deepStrictEqual(buildFilter({ from: "pas-une-date" }), {});
});

test("les criteres se combinent", () => {
  const filter = buildFilter({ sensor: "665f", min: "25" });
  assert.deepStrictEqual(filter, { sensor: "665f", value: { $gte: 25 } });
});

test("un operateur envoye par le client est ignore", () => {
  // Tentative d'injection : ?value[$gt]= construirait un objet cote Express.
  const filter = buildFilter({ value: { $gt: "" }, autreChamp: "x" });
  assert.deepStrictEqual(filter, {});
});

console.log("\nbuildSort");

test("par defaut : date decroissante", () => {
  assert.deepStrictEqual(buildSort({}), { createdAt: -1 });
});

test("tri croissant sur demande", () => {
  assert.deepStrictEqual(buildSort({ order: "asc" }), { createdAt: 1 });
});

test("tri sur un champ autorise", () => {
  assert.deepStrictEqual(buildSort({ sort: "value" }), { value: -1 });
});

test("un champ non autorise retombe sur le defaut", () => {
  assert.deepStrictEqual(buildSort({ sort: "motDePasse" }), { createdAt: -1 });
});

console.log(`\n${passed} tests reussis\n`);
