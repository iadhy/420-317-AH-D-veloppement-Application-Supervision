/**
 * Tests de src/mqtt.js, SANS courtier et SANS base de donnees.
 *
 * Ils verifient seulement les deux fonctions pures : topicOf et parseMeasure.
 * La connexion au courtier, elle, se verifie avec un client MQTT web (voir le README).
 *
 * Lancer avec : npm run test:mqtt
 */
import assert from "assert";

const { topicOf, parseMeasure } = await import("../mqtt.js");

let passed = 0;
let failed = 0;
function test(nom, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  ok  ${nom}`);
  } catch (erreur) {
    failed += 1;
    console.log(`  ECHEC  ${nom}\n         ${erreur.message.split("\n")[0]}`);
  }
}

// Un refus doit etre une VRAIE erreur de validation, pas le "TODO" de depart.
function refuse(topic, payload) {
  let erreur = null;
  try {
    parseMeasure(topic, payload);
  } catch (e) {
    erreur = e;
  }
  assert.ok(erreur, "aucune erreur levee : ce message aurait du etre refuse");
  assert.ok(!erreur.message.startsWith("TODO"), "parseMeasure n'est pas encore ecrite");
}

console.log("\ntopicOf");

test("prefixe le sujet de l'identifiant", () => {
  assert.strictEqual(topicOf("temp-b127"), "supervision/temp-b127");
});

console.log("\nparseMeasure : messages valides");

test("lit un objet JSON avec un nombre", () => {
  assert.deepStrictEqual(parseMeasure("supervision/temp-b127", '{"value":22.4}'), {
    sensor: "temp-b127",
    value: 22.4,
  });
});

test("accepte un Buffer (c'est ce que le client MQTT remet)", () => {
  assert.deepStrictEqual(parseMeasure("supervision/hum-b127", Buffer.from('{"value":45}')), {
    sensor: "hum-b127",
    value: 45,
  });
});

test("accepte zero et les valeurs negatives", () => {
  assert.strictEqual(parseMeasure("supervision/t", '{"value":0}').value, 0);
  assert.strictEqual(parseMeasure("supervision/t", '{"value":-3.5}').value, -3.5);
});

test("ignore les champs en trop", () => {
  assert.deepStrictEqual(parseMeasure("supervision/t", '{"value":1,"extra":true}'), {
    sensor: "t",
    value: 1,
  });
});

console.log("\nparseMeasure : messages refuses");

test("JSON invalide", () => refuse("supervision/t", "{value:"));
test("contenu vide", () => refuse("supervision/t", ""));
test("JSON qui n'est pas un objet", () => refuse("supervision/t", "22.4"));
test("tableau", () => refuse("supervision/t", "[22.4]"));
test("null", () => refuse("supervision/t", "null"));
test("value absente", () => refuse("supervision/t", '{"temperature":22.4}'));
test("value en texte", () => refuse("supervision/t", '{"value":"22.4"}'));
test("value nulle", () => refuse("supervision/t", '{"value":null}'));
test("value booleenne", () => refuse("supervision/t", '{"value":true}'));

console.log("\nparseMeasure : sujets refuses");

test("mauvais prefixe", () => refuse("autre/t", '{"value":1}'));
test("identifiant vide", () => refuse("supervision/", '{"value":1}'));
test("sujet sans identifiant", () => refuse("supervision", '{"value":1}'));
test("identifiant avec un niveau de plus", () => refuse("supervision/a/b", '{"value":1}'));

console.log(`\n${passed} tests reussis, ${failed} en echec`);
process.exit(failed === 0 ? 0 : 1);
