# Démarrage local — Gym Tracker

## Prérequis

- Node.js 20+ recommandé
- Docker Desktop lancé
- Un terminal à la racine du projet

## 1. Installer les dépendances

```bash
npm install
npm --prefix backend install
npm --prefix frontend install
```

## 2. Lancer PostgreSQL local

```bash
docker compose up -d
```

La base locale utilise :

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gym_tracker?schema=public"
```

## 3. Générer Prisma + appliquer les migrations

```bash
cd backend
npm run db:generate
npm run db:migrate
```

Si Prisma demande un nom de migration, tu peux laisser celui proposé ou mettre :

```txt
init_local
```

## 4. Créer le super admin

Toujours dans `backend` :

```bash
npm run create:super-admin
```

Compte créé par défaut avec le `.env` fourni :

```txt
admin@gym-tracker.local
password123
```

## 5. Lancer le backend

Dans un terminal :

```bash
cd backend
npm run dev
```

API : `http://localhost:3000`

Test rapide :

```bash
curl http://localhost:3000/health
```

## 6. Lancer le frontend

Dans un deuxième terminal :

```bash
cd frontend
npm run dev
```

Frontend : `http://localhost:5173`

## Notes importantes

- Les fichiers `.env` sont déjà ajoutés pour le dev local.
- Les fichiers `.env.example` servent de modèle pour GitHub / autres machines.
- Si `prisma generate` échoue à cause d’un téléchargement Prisma, vérifie ta connexion internet : Prisma doit télécharger son moteur localement la première fois.
- Le super admin sert surtout à ajouter les exercices globaux.
- Un utilisateur normal peut ensuite créer ses entraînements et lancer une séance.

## Commandes utiles

```bash
# Voir la BDD dans Prisma Studio
cd backend
npm run db:studio

# Reset complet de la base locale
cd backend
npm run db:reset

# Typecheck frontend
cd frontend
npm run typecheck

# Build frontend
cd frontend
npm run build
```
