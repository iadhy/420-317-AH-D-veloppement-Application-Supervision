# Séance 7 — réponses

## Partie 4 — Les deux options de `findByIdAndUpdate`

### Sans `new: true`

La réponse contient l'**ancien** document, celui d'avant la modification.

La mise à jour a pourtant bien eu lieu en base — on peut le vérifier dans Browse Collections,
ou en refaisant un `GET` juste après. C'est uniquement la valeur **retournée** qui est périmée.

Le symptôme est trompeur : on croit que l'écriture a échoué et on cherche un bogue là où il n'y
en a pas.

### Sans `runValidators: true`

La valeur hors bornes est **acceptée**, malgré le `max` déclaré dans le schéma.

Par défaut, Mongoose n'applique les validations qu'à la **création**, pas aux mises à jour.
Conséquence : une collection peut se remplir de documents invalides alors que le schéma semble
les interdire.

## Partie 5 — Identifiant invalide

`GET /api/measures/bonjour` sans le middleware donne un **500**, avec un `CastError` dans la
console : Mongoose n'arrive pas à convertir `"bonjour"` en `ObjectId`.

C'est un mauvais code. Le serveur n'a pas de panne : c'est le client qui a envoyé un
identifiant mal formé. La bonne réponse est **400**.

À distinguer d'un identifiant bien formé mais absent de la base, qui est un **404** — la
requête était correcte, la ressource n'existe pas.
