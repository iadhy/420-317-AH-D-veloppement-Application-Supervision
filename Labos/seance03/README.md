# Supervision — 420-317-AH

## État après la séance 3

API HTTP native, sans framework.

| Route | Renvoie | Codes |
|---|---|---|
| `GET /` | la page | 200 |
| `GET /api/measures` | toutes les mesures | 200 |
| `GET /api/measures?min=` | celles au-dessus du seuil | 200 |
| `GET /api/measures/latest` | la plus récente | 200 / 404 |
| `GET /api/measures/stats` | min, max, moyenne, nombre | 200 |
| `POST /api/measures` | la mesure créée | 201 / 400 |
| toute autre | erreur JSON | 404 |

## Ce qui est pénible (à revoir en séance 5)

- Chaque route répète la vérification de méthode et de chemin
- Un `return` oublié fait répondre deux fois
- Le corps du POST doit être assemblé à la main
- Une condition et un `Content-Type` par fichier statique
- Le routage et la logique métier sont dans la même fonction

## Lancer

```
npm install
npm run dev
```
