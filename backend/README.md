# Backend Express

## Installation

```bash
npm install
copy .env.example .env
```

Renseigner ensuite les variables MySQL et `JWT_SECRET` dans `.env`.

## Base de données

Appliquer les migrations Prisma :

```bash
npx prisma migrate deploy
npx prisma generate
```

## Lancement

```bash
npm run dev
```

Le serveur écoute par défaut sur `http://localhost:5000`.

## API documents, fichiers et droits

Toutes les routes ci-dessous nécessitent `Authorization: Bearer <token>`.

| Méthode | Route | Fonction |
| --- | --- | --- |
| GET/POST | `/api/folders` | Lister ou créer un dossier |
| PATCH/DELETE | `/api/folders/:id` | Modifier ou supprimer un dossier |
| GET/POST | `/api/documents` | Lister ou créer un document |
| GET/PATCH/DELETE | `/api/documents/:id` | Consulter, modifier ou supprimer un document |
| GET/POST | `/api/documents/:id/files` | Lister ou ajouter un fichier (`multipart/form-data`, champ `file`) |
| PUT/DELETE | `/api/documents/:id/files/:fileId` | Remplacer ou supprimer un fichier |
| GET | `/api/documents/:id/files/:fileId/download` | Télécharger un fichier |
| GET/PUT/DELETE | `/api/documents/:id/permissions/:userId` | Consulter ou gérer un droit utilisateur |

Les fichiers sont stockés localement dans `storage/uploads` et la taille maximale est de 20 Mo.
