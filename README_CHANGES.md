# PR feat/mvp-workout-usage

Fichiers modifiés pour le MVP rapide :

- `backend/prisma/schema.prisma`
  - ajout de `ExerciseSide` : `BOTH`, `LEFT`, `RIGHT`
  - ajout du champ `side` sur `ExerciseSet`
  - unique set sur `(sessionExerciseId, setNumber, side)`

- `backend/src/schemas/workout.schema.ts`
  - validation Zod du champ `side`

- `backend/src/services/workout.service.ts`
  - sauvegarde du champ `side`
  - upsert des séries par exercice + numéro + côté

- `backend/src/services/exercise.service.ts`
  - seed automatique d'exercices par défaut quand la base est vide

- `frontend/src/types.ts`
  - ajout du type `ExerciseSide`

- `frontend/src/api.ts`
  - envoi du champ `side` lors de l'ajout d'une série

- `frontend/src/App.tsx`
  - bouton séance rapide
  - lancement direct d'une séance sans template
  - vraie saisie gauche/droite/bilatéral
  - UX séance en cours plus mobile-first

- `frontend/src/styles.css`
  - amélioration mobile et séance en cours

Après copie, lance côté backend :

```bash
npm run db:generate
npx prisma db push
```

Puis redémarre backend + frontend.
