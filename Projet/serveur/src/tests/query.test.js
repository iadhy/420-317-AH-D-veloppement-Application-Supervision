/**
 * Tests des fonctions de construction de requete.
 * Aucune base de donnees necessaire : ce sont des fonctions pures.
 */
import assert from "assert";
import { buildFilter, buildSort, buildPagination, buildPaginationMeta } from "../utils/query.js";

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

console.log("\nbuildPagination");

test("valeurs par defaut", () => {
  assert.deepStrictEqual(buildPagination({}), { page: 1, limit: 20, skip: 0 });
});

test("skip calcule a partir de la page", () => {
  assert.deepStrictEqual(buildPagination({ page: "3", limit: "20" }), { page: 3, limit: 20, skip: 40 });
});

test("la limite est plafonnee a 100", () => {
  assert.strictEqual(buildPagination({ limit: "999999" }).limit, 100);
});

test("une page negative retombe sur 1", () => {
  assert.strictEqual(buildPagination({ page: "-5" }).page, 1);
});

test("une page non entiere retombe sur 1", () => {
  // Number.isInteger(2.5) est false : > 0 seul ne suffirait pas a l'exclure.
  assert.strictEqual(buildPagination({ page: "2.5" }).page, 1);
});

test("une page non numerique retombe sur 1", () => {
  assert.strictEqual(buildPagination({ page: "deux" }).page, 1);
});

test("une limite a zero retombe sur le defaut", () => {
  assert.strictEqual(buildPagination({ limit: "0" }).limit, 20);
});

console.log("\nbuildPaginationMeta");

test("calcule le nombre de pages", () => {
  assert.deepStrictEqual(
    buildPaginationMeta({ page: 1, limit: 20, total: 45 }),
    { page: 1, limit: 20, total: 45, pages: 3 },
  );
});

test("aucune donnee : zero page", () => {
  assert.strictEqual(buildPaginationMeta({ page: 1, limit: 20, total: 0 }).pages, 0);
});

console.log(`\n${passed} tests reussis\n`);
