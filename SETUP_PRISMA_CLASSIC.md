# Reset propre du projet Gym Tracker

Cette version repasse Prisma en mode classique (`new PrismaClient()`), sans `@prisma/adapter-pg`.
C'est plus simple et plus stable pour démarrer avec Supabase.

## 1. Backend

Dans `backend`, créer `.env` à partir de `.env.example` :

```env
DATABASE_URL="postgresql://postgres:TON_PASSWORD@db.TON_PROJECT_REF.supabase.co:5432/postgres?sslmode=require"
JWT_SECRET="dev-secret-change-me"
PORT=3000
SUPER_ADMIN_EMAIL="admin@gym-tracker.local"
SUPER_ADMIN_PASSWORD="password123"
```

Puis lancer :

```bash
cd backend
rm -rf node_modules package-lock.json
npm install
npm run db:generate
npm run db:push
npm run create:super-admin
npm run dev
```

Si tu veux reset complètement la base Supabase :

```bash
npm run db:reset
npm run create:super-admin
```

## 2. Frontend

Dans `frontend`, créer `.env` :

```env
VITE_API_URL=http://localhost:3000
```

Puis :

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

Compte admin :

```txt
admin@gym-tracker.local
password123
```
