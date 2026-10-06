/**
 * Tests des schemas, executables SANS connexion a MongoDB.
 *
 * validateSync() applique les contraintes du schema sur un document en
 * memoire : c'est la facon de verifier required, min, max et enum sans
 * qu'aucune base ne tourne.
 *
 * Lancer avec : npm test
 */
import assert from "assert";
import Measure from "../models/measure.model.js";
import Sensor from "../models/sensor.model.js";

let passed = 0;
function test(nom, fn) {
  fn();
  passed += 1;
  console.log(`  ok  ${nom}`);
}

console.log("\nSchema Sensor");

test("refuse un capteur sans id", () => {
  const erreur = new Sensor({
    name: "T", unit: "C", min: 0, max: 50, threshold: 28, direction: "above",
  }).validateSync();
  assert.ok(erreur.errors._id, "_id devrait etre obligatoire");
});

test("refuse un id contenant un caractere interdit", () => {
  const erreur = new Sensor({
    _id: "salle b1/127", name: "T", unit: "C", min: 0, max: 50, threshold: 28, direction: "above",
  }).validateSync();
  assert.ok(erreur.errors._id, "l'espace et le / devraient etre refuses");
});

test("refuse un capteur sans nom", () => {
  const erreur = new Sensor({
    _id: "t1", unit: "C", min: 0, max: 50, threshold: 28, direction: "above",
  }).validateSync();
  assert.ok(erreur.errors.name, "le champ name devrait etre obligatoire");
});

test("refuse une direction invalide", () => {
  const erreur = new Sensor({
    _id: "t1", name: "T", unit: "C", min: 0, max: 50, threshold: 28, direction: "sideways",
  }).validateSync();
  assert.ok(erreur.errors.direction, "direction doit etre above ou below");
});

test("accepte un capteur complet", () => {
  const erreur = new Sensor({
    _id: "temp-b127", name: "Temperature", unit: "C", min: -10, max: 50, threshold: 28, direction: "above",
  }).validateSync();
  assert.strictEqual(erreur, undefined);
});

test("active vaut true par defaut", () => {
  const sensor = new Sensor({
    _id: "t1", name: "T", unit: "C", min: 0, max: 50, threshold: 28, direction: "below",
  });
  assert.strictEqual(sensor.active, true);
});

console.log("\nSchema Measure");

test("refuse une mesure sans capteur", () => {
  const erreur = new Measure({ value: 22.4 }).validateSync();
  assert.ok(erreur.errors.sensor);
});

test("accepte un id de capteur texte (pas un ObjectId)", () => {
  const erreur = new Measure({ sensor: "temp-b127", value: 22.4 }).validateSync();
  assert.strictEqual(erreur, undefined);
});

test("refuse une valeur non numerique", () => {
  const erreur = new Measure({ sensor: "temp-b127", value: "vingt" }).validateSync();
  assert.ok(erreur.errors.value);
});

test("refuse une valeur hors bornes", () => {
  const erreur = new Measure({ sensor: "temp-b127", value: 999999 }).validateSync();
  assert.ok(erreur.errors.value);
});

test("accepte une mesure valide", () => {
  const erreur = new Measure({ sensor: "temp-b127", value: 22.4 }).validateSync();
  assert.strictEqual(erreur, undefined);
});

test("createdAt est rempli automatiquement", () => {
  const measure = new Measure({ sensor: "temp-b127", value: 22.4 });
  assert.ok(measure.createdAt instanceof Date);
});

console.log(`\n${passed} tests reussis\n`);
