# Projet Spé 4 — Répartition des tâches

## Objectif

Développer une application web collaborative de gestion documentaire : comptes utilisateurs, organisation et partage de fichiers, édition de documents textuels en temps réel et appels audio.

La répartition ci-dessous attribue un responsable principal à chaque lot. Elle suit le découpage de l'équipe en **3 personnes backend** et **2 personnes frontend**. Tous les membres participent aux revues, aux tests d'intégration et à la préparation du rendu.

## Répartition par personne

### Backend — 3 personnes

#### 👤 Personne 1 — Architecture, comptes & déploiement

**Responsabilités :**

* Définir l'architecture des deux serveurs, leurs rôles et les échanges entre eux.
* Documenter et justifier les choix techniques et architecturaux.
* Préparer les environnements, la configuration et le déploiement.
* Développer l'inscription, la connexion et la déconnexion.
* Développer la gestion du profil.
* Mettre en place la double authentification.
* Développer l'administration des comptes :

  * création ;
  * blocage ;
  * déblocage.

---

#### 👤 Personne 2 — Documents, fichiers & droits d'accès

**Responsabilités :**

* Développer l'organisation en dossiers et documents.
* Gérer les fichiers :

  * ajout ;
  * remplacement ;
  * suppression ;
  * stockage.
* Gérer les métadonnées :

  * date de dernière modification ;
  * dernier auteur.
* Vérifier et appliquer les droits d'accès aux documents et aux fichiers.

---

#### 👤 Personne 3 — Collaboration & temps réel

**Responsabilités :**

* Fournir les services de lecture et d'enregistrement des documents textuels.
* Mettre en place la synchronisation des modifications en temps réel.
* Développer la sauvegarde automatique.
* Gérer la reprise après reconnexion.
* Implémenter le canal serveur nécessaire à la collaboration en temps réel.
* Mettre en place la signalisation nécessaire aux appels audio.
* Définir les API et événements utilisés par les personnes 4 et 5.

---

### Frontend — 2 personnes

#### 👤 Personne 4 — Interface principale & édition

**Responsabilités :**

* Construire les écrans :

  * connexion ;
  * profil ;
  * espace documentaire ;
  * navigation dans les dossiers et fichiers ;
  * éditeur.
* Connecter les vues aux API des personnes 1 à 3.
* Afficher l'auteur et la date de modification.
* Gérer les états :

  * chargement ;
  * validation ;
  * erreur.

---

#### 👤 Personne 5 — Invitations & appels audio

**Responsabilités :**

* Construire le parcours d'invitation d'un collaborateur sur un document.
* Développer l'interface d'appel audio :

  * démarrer ;
  * accepter/refuser si applicable ;
  * terminer ;
  * état du microphone.
* Intégrer le client audio et la signalisation fournie par la personne 3.
* Gérer les permissions du microphone.
* Gérer les erreurs d'appel côté utilisateur.

---

## Interfaces entre les lots

- La personne 1 coordonne les contrats communs (modèles de données, authentification, conventions d'API) et organise l'intégration des deux serveurs. L'équipe choisit et justifie leur rôle; la personne 1 met en œuvre le déploiement retenu.
- La personne 2 est responsable des règles d'accès aux documents. Les vues de la personne 4 et le parcours d'invitation de la personne 5 consomment ces règles et les API associées.
- La personne 3 fournit les API et événements de collaboration; les personnes 4 et 5 les intègrent dans l'éditeur et l'expérience d'appel.
- Avant le développement en parallèle, les cinq personnes valident les contrats d'API, les événements temps réel, les permissions et la gestion des erreurs.


## Jalons proposés

1. **Cadrage** : nommer les responsables, choisir les technologies, décider du rôle des deux serveurs et valider les modèles de données et contrats d'API.
2. **Socle** : comptes, droits, espace documentaire, stockage et premières vues de l'application.
3. **Collaboration** : édition temps réel, sauvegarde automatique, invitations et appels audio.
4. **Stabilisation** : intégration sur les deux serveurs, tests de bout en bout, vérifications de sécurité et corrections.
5. **Rendu** : préparer l'archive ZIP du code source, le README de lancement, le fichier `.env.example` si l'application utilise un `.env`, et le document de justification des choix organisationnels, techniques et architecturaux. Vérifier le dépôt sur Yapareo avec la liste des membres.

## Membres du groupe

- **Personne 1 :** Alban COUSSEAU
- **Personne 2 :** Lorenzo PORRETTI
- **Personne 3 :** Nguyen
- **Personne 4 :** Ilef BELAED
- **Personne 5 :** Sam DRONNEAU

## Informations à compléter

- Technologies retenues : __________________________
- Rôle du serveur 1 : Backend // Express
- Rôle du serveur 2 : Frontend // Vue avec TypeScript
