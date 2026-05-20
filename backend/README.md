# Gym Tracker Backend

API Node.js / TypeScript pour créer des entraînements de musculation, suivre les séances, gérer plusieurs comptes, lancer des séances en duo et suivre la progression.

## Stack

- Node.js + TypeScript
- Express 5
- Prisma 7
- PostgreSQL
- Zod
- Vitest + Supertest
- JWT + bcrypt
- Docker Compose pour la base de test

## Modèle fonctionnel

- **Users** : inscription, connexion, profil courant.
- **Exercises** : catalogue d'exercices avec groupe musculaire.
- **Workout templates** : séances types réutilisables.
- **Workout sessions** : séance planifiée ou réalisée.
- **Duo / multi-participants** : une même séance peut être partagée par plusieurs comptes.
- **Exercise sets** : séries avec répétitions, charge, durée ou distance.
- **Progress** : nombre de séances terminées, séries validées, volume total en kg.

## Installation

```bash
npm install
cp .env.example .env
npx prisma generate
```

Configure ensuite `DATABASE_URL` dans `.env`.

## Développement

```bash
npm run dev
```

Health check :

```bash
GET http://localhost:3000/health
```

## Tests d'intégration

```bash
npm run test:integration
```

Ce script lance PostgreSQL via Docker, applique les migrations Prisma puis exécute Vitest.

## Routes principales

### Auth

```http
POST /auth/register
POST /auth/login
GET /auth/me
```

### Exercises

```http
GET /exercises
POST /exercises
```

### Workouts

```http
GET /workouts/templates
POST /workouts/templates
GET /workouts/sessions
POST /workouts/sessions
PATCH /workouts/sessions/:sessionId/status
POST /workouts/session-exercises/:sessionExerciseId/sets
```

### Progress

```http
GET /progress
```

## Exemple rapide

1. Créer un compte avec `/auth/register`.
2. Se connecter avec `/auth/login`.
3. Utiliser le token dans le header :

```http
Authorization: Bearer <token>
```

4. Créer des exercices : Squat, développé couché, rowing, etc.
5. Créer une séance type.
6. Lancer une séance réelle, seul ou avec un autre utilisateur.
7. Ajouter les séries au fur et à mesure.
8. Passer la séance en `COMPLETED`.
9. Lire `/progress`.
