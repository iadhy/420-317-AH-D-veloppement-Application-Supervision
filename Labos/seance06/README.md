# Supervision — 420-317-AH

## État après la séance 6

Deux ressources, deux étendues.

### `measures` — lecture seule

| Méthode | Route | Renvoie | Codes |
|---|---|---|---|
| GET | `/api/measures` | toutes les mesures | 200 |
| GET | `/api/measures?min=` | celles au-dessus du seuil | 200 |
| GET | `/api/measures/latest` | la plus récente | 200 / 404 |
| GET | `/api/measures/stats` | min, max, moyenne, nombre | 200 |
| GET | `/api/measures/:id` | une mesure | 200 / 404 |

**Pourquoi aucune écriture.** Une mesure n'est jamais créée par une personne à travers
l'interface. Elle arrive par le capteur simulé (aujourd'hui) ou par l'objet connecté via MQTT
(séance 14), directement dans `measure.service.js` — jamais par une route HTTP publique.
Exposer un `POST` ici n'aurait aucun appelant légitime.

### `sensors` — CRUD complet

| Méthode | Route | Corps attendu | Renvoie | Codes |
|---|---|---|---|---|
| GET | `/api/sensors` | — | tous les capteurs | 200 |
| GET | `/api/sensors/:id` | — | un capteur | 200 / 404 |
| POST | `/api/sensors` | `{ name, unit, threshold, direction }` | le capteur créé | 201 / 400 |
| PUT | `/api/sensors/:id` | `{ name, unit, threshold, direction }` | le capteur modifié | 200 / 400 / 404 |
| DELETE | `/api/sensors/:id` | — | rien | 204 / 404 |

**Pourquoi le CRUD complet ici.** C'est le tableau de bord qui crée un capteur, pour commencer
à écouter le bon sujet MQTT (séance 14). C'est le seul endroit du système où une personne crée
une ressource à travers l'API.

## Points de conception

**L'ordre des routes.** `/latest` et `/stats` sont déclarées **avant** `/:id` dans le routeur
de `measures`, sinon elles seraient capturées comme des identifiants.

**`active` ne vient jamais du client.** Le service pose `active: true` avant tout étalement de
champs reçus. Un `POST` contenant `"active": false` est créé actif quand même — testé et
vérifié.

**Un message de validateur n'est pas une erreur brute.** `.withMessage(...)` est écrit par
nous, aucun risque à le renvoyer. `errors.array().map((e) => e.msg)` réduit la réponse à ce que
le client doit corriger, sans exposer la structure interne d'`express-validator`.

## Lancer

```
npm install
npm run dev
```
