# TransferePro API

Backend de l'application TransferePro (gestion de transferts d'argent).

## Stack technique

- Node.js + Express 5 + TypeScript
- Prisma ORM + PostgreSQL
- Authentification par JWT
- Validation des données avec Zod

## Prérequis

- Node.js 20 ou supérieur
- Une base de données PostgreSQL accessible (locale ou hébergée, ex. Neon, Supabase, RDS...)

## Installation

```bash
git clone <url-du-repo>
cd transfertPro_api
npm install
```

## Configuration

Copier le fichier d'exemple et le remplir avec de vraies valeurs :

```bash
cp .env.example .env
```

Variables à renseigner dans `.env` :

| Variable | Description |
|---|---|
| `NODE_ENV` | `development` ou `production` |
| `PORT` | Port d'écoute de l'API (défaut : `3000`) |
| `DATABASE_URL` | URL de connexion PostgreSQL, format `postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require` |
| `FRONTEND_URL` | Origine autorisée par CORS — `http://localhost:5173` en dev, le vrai domaine du frontend en prod |
| `JWT_SECRET` | Secret utilisé pour signer les tokens JWT — **à générer aléatoirement**, ne jamais réutiliser une valeur d'exemple |
| `JWT_EXPIRES_IN` | Durée de validité des tokens (ex. `24h`) |
| `ADMIN_FIRST_NAME` / `ADMIN_LAST_NAME` / `ADMIN_EMAIL` / `ADMIN_PHONE` / `ADMIN_PASSWORD` | Identifiants du compte administrateur créé automatiquement par le seed |

Pour générer un `JWT_SECRET` sûr :

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

⚠️ `.env` contient des secrets réels (mot de passe DB, JWT secret, mot de passe admin) : il ne doit **jamais** être commité. Il est déjà listé dans `.gitignore`.

## Base de données

Appliquer les migrations existantes :

```bash
npx prisma migrate deploy
```

Générer le client Prisma (fait automatiquement par `npm install`, mais utile après un changement de schéma) :

```bash
npx prisma generate
```

Créer le compte administrateur et les données de base (villes) :

```bash
npm run seed
```

## Lancer en développement

```bash
npm run dev
```

L'API démarre sur `http://localhost:PORT` (3000 par défaut) avec rechargement automatique.

## Build et production

```bash
npm run build
npm start
```

## Lint

```bash
npm run lint
```

## Frontend

Ce backend est utilisé par le frontend TransferePro (`transferePro_web`, React + Vite). En développement, le frontend proxie ses appels `/api` vers `http://localhost:3000` — assurez-vous que l'API tourne avant de lancer le frontend. 

cd transferePro_web
npm install
npm run dev          # sur http://localhost:5173
