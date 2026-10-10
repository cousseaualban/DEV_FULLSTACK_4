# Backend

API du projet, développée avec **Node.js** et **Express**.

## Technologies choisies

- **Express** fournit un serveur HTTP léger et modulaire. Son système de routes et de middlewares structure l'API REST, l'authentification et le traitement des fichiers.
- **MySQL** stocke les données relationnelles du projet, notamment les utilisateurs, dossiers, documents, fichiers et droits d'accès.
- **Prisma** sert d'ORM entre l'application et MySQL. Le schéma décrit les modèles et leurs relations, tandis que les migrations permettent de faire évoluer la base de données de façon reproductible.

## Installation

```bash
npm install
copy .env.example .env
```

Configurer ensuite les variables de connexion MySQL et `JWT_SECRET` dans `.env`.

## Base de données

Appliquer les migrations Prisma et générer le client :

```bash
npx prisma migrate deploy
npx prisma generate
```

## Création des utilisateurs de test

Exécuter le seeder afin de créer deux utilisateurs de test : un utilisateur classique (`USER`) et un administrateur (`ADMIN`).

```bash
npm run seed
```

Cette commande exécute `prisma/seed.js`. Les comptes sont créés ou mis à jour automatiquement et leurs mots de passe sont hachés avant leur enregistrement.

## Lancement

```bash
npm run dev
```

Le serveur de l'API REST écoute par défaut sur `http://localhost:5000`.

## Routes de l'API REST

À l'exception de la vérification de santé et des routes de connexion, les routes ci-dessous nécessitent un jeton JWT transmis dans l'en-tête `Authorization: Bearer <token>`. Les routes d'administration nécessitent également le rôle `ADMIN`.

### Santé

| Méthode | Route | Accès | Fonction |
| --- | --- | --- | --- |
| GET | `/api/health` | Public | Vérifier l'état de l'API |

### Authentification et profil

| Méthode | Route | Accès | Fonction |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | Public | Se connecter |
| POST | `/api/auth/2fa/login` | Public | Terminer la connexion avec le code 2FA |
| GET | `/api/auth/me` | Authentifié | Consulter son profil |
| PUT | `/api/auth/me` | Authentifié | Modifier son profil |
| PUT | `/api/auth/password` | Authentifié | Changer son mot de passe |
| POST | `/api/auth/2fa/setup` | Authentifié | Préparer l'activation de la double authentification |
| POST | `/api/auth/2fa/verify` | Authentifié | Vérifier et activer la double authentification |
| POST | `/api/auth/logout` | Authentifié | Se déconnecter |

### Utilisateurs

| Méthode | Route | Accès | Fonction |
| --- | --- | --- | --- |
| GET | `/api/users` | Authentifié | Rechercher des utilisateurs |

### Dossiers

| Méthode | Route | Accès | Fonction |
| --- | --- | --- | --- |
| GET | `/api/folders` | Authentifié | Lister les dossiers |
| POST | `/api/folders` | Authentifié | Créer un dossier |
| PATCH | `/api/folders/:id` | Authentifié | Modifier un dossier |
| DELETE | `/api/folders/:id` | Authentifié | Supprimer un dossier |

### Documents, fichiers et droits

| Méthode | Route | Accès | Fonction |
| --- | --- | --- | --- |
| GET | `/api/documents` | Authentifié | Lister les documents |
| POST | `/api/documents` | Authentifié | Créer un document |
| GET | `/api/documents/:id` | Authentifié | Consulter un document |
| PATCH | `/api/documents/:id` | Authentifié | Modifier un document |
| DELETE | `/api/documents/:id` | Authentifié | Supprimer un document |
| GET | `/api/documents/:id/collaborators` | Authentifié | Lister les collaborateurs d'un document |
| GET | `/api/documents/:id/files` | Authentifié | Lister les fichiers d'un document |
| POST | `/api/documents/:id/files` | Authentifié | Ajouter un fichier |
| PUT | `/api/documents/:id/files/:fileId` | Authentifié | Remplacer un fichier |
| GET | `/api/documents/:id/files/:fileId/download` | Authentifié | Télécharger un fichier |
| DELETE | `/api/documents/:id/files/:fileId` | Authentifié | Supprimer un fichier |
| GET | `/api/documents/:id/permissions` | Authentifié | Lister les droits d'accès |
| PUT | `/api/documents/:id/permissions/:userId` | Authentifié | Définir le droit d'un utilisateur |
| DELETE | `/api/documents/:id/permissions/:userId` | Authentifié | Retirer le droit d'un utilisateur |

L'ajout et le remplacement de fichiers attendent une requête `multipart/form-data` avec un champ `file`. Les fichiers sont stockés localement dans `storage/uploads` et leur taille maximale est de 20 Mo.

### Administration

Toutes les routes de cette section sont réservées aux administrateurs.

| Méthode | Route | Accès | Fonction |
| --- | --- | --- | --- |
| POST | `/api/admin/users` | Administrateur | Créer un compte utilisateur |
| GET | `/api/admin/users` | Administrateur | Lister les utilisateurs |
| PUT | `/api/admin/users/:id/block` | Administrateur | Bloquer ou débloquer un utilisateur |
| PUT | `/api/admin/users/:id/role` | Administrateur | Modifier le rôle d'un utilisateur |

## Serveur de collaboration

Le point d'entrée `src/server.ts` est distinct du serveur REST lancé par `npm run dev` et `npm start` ; les deux serveurs utilisent le port `5000` par défaut et ne peuvent donc pas être lancés simultanément. Il expose aussi `GET /` et les routes de contenu `GET` et `PUT /api/documents/:documentId/content`, et configure Socket.IO pour la collaboration en temps réel. La route `GET` attend un `userId` de test dans la query string, par exemple `?userId=...`. La route `PUT` répond actuellement avec le statut `409` : les modifications doivent passer par le canal collaboratif.
