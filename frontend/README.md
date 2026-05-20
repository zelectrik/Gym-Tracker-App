# Gym Tracker Frontend

Frontend React + TypeScript + Vite pour le backend `gym-tracker-backend`.

## Routes backend utilisées

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `GET /exercises`
- `POST /exercises`
- `GET /workouts/templates`
- `POST /workouts/templates`
- `GET /workouts/sessions`
- `POST /workouts/sessions`
- `PATCH /workouts/sessions/:sessionId/status`
- `POST /workouts/session-exercises/:sessionExerciseId/sets`
- `GET /progress`

## Lancer le projet

```bash
npm install
cp .env.example .env
npm run dev
```

Par défaut, le frontend appelle le backend sur `http://localhost:3000`.
Tu peux changer l'URL dans `.env` :

```bash
VITE_API_URL=http://localhost:3000
```

## Fonctionnalités

- Écran de connexion / création de compte
- Dashboard user
- Création d'entraînements templates
- Lancement d'une séance depuis un template
- Saisie des séries : reps, charge, validation
- Fin de séance avec passage en `COMPLETED`
- Progression : séances terminées, séries validées, volume total
- Dashboard super admin si le rôle utilisateur est `SUPER_ADMIN`
- Ajout d'exercices dans la base générale

## Limites connues liées au backend actuel

- Il n'existe pas encore de route backend pour lister les utilisateurs ou compter les inscrits. Le bloc est prévu côté interface.
- La nuance gauche/droite est prévue dans l'interface de saisie, mais les champs ne sont pas encore persistés côté backend.
- Le backend ne limite pas encore `POST /exercises` aux super admins. Le frontend affiche cette action dans le dashboard super admin, mais la sécurité doit être ajoutée côté API.
