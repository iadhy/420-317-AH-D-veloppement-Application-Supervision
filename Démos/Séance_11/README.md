# Supervision, 420-317-AH

## Etat apres la demo de la seance 11

Ajoute a la seance 9 : modele `User`, inscription et connexion, `protect` sur `/api/sensors`,
une seule route reservee a l'admin (`DELETE /api/sensors/:id`), `helmet`, `cors` (facultatif),
limite de debit sur la connexion, corps limite a 10 ko.

Les mesures (`/api/measures`) ne sont pas encore protegees : c'est le travail du laboratoire.

## Configuration

Copier `.env.exemple` en `.env` et remplir. Ne jamais versionner `.env`.

## Comptes

```
npm run seed:users
```

Cree `admin@supervision.test` et `operator@supervision.test` (mots de passe lus dans `.env`).
`POST /api/auth/register` cree toujours un `reader`.

## Lancer

```
npm install
npm run dev
```
