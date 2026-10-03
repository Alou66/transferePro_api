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
| `ENABLE_DATA_RESET` | Activation de la réinitialisation des données (opération destructive). **À laisser sur `false`**. Seule la chaîne exacte `true` l'active |

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

## Tests

```bash
npm test
```

## Réinitialisation des données (opération destructive)

Endpoint d'administration qui vide les données de test :

```http
POST /api/admin/maintenance/reset-data
Content-Type: application/json

{"confirmation":"RESET"}
```

### Portée exacte

| Table | Traitement |
|---|---|
| `cash_collections` | supprimée (tous les encaissements) |
| `transfers` | supprimée (transferts, bénéficiaires, paiements) |
| `users` | supprimées **uniquement les lignes `role = 'AGENT'`** |
| `cities` | conservée |
| `users` (`role = 'ADMIN'`) | conservé |
| `_prisma_migrations` | conservée |

Les trois suppressions s'exécutent dans une seule transaction Prisma, dans
l'ordre imposé par les clés étrangères `ON DELETE RESTRICT`. En cas d'erreur,
la transaction est annulée et aucune suppression partielle ne subsiste.

Ce n'est ni un `DROP`, ni un `TRUNCATE`, ni un `DELETE FROM users` sans
condition : le filtre `role = 'AGENT'` est la garantie que le compte
administrateur survit à l'opération. Le compte à l'origine de la requête est
en outre relu en fin de transaction ; s'il a disparu, tout est annulé.

Aucune séquence n'est réinitialisée : toutes les clés primaires sont des UUID
(`@default(uuid())`), il n'existe donc aucune séquence à manipuler.

### Conditions d'accès

Les quatre conditions suivantes sont cumulatives :

```text
1. JWT valide                       sinon 401
2. rôle ADMIN                       sinon 403
3. confirmation exactement "RESET"   sinon 400
4. ENABLE_DATA_RESET=true           sinon 403
```

Le point 4 est le verrou principal. La variable est analysée en « fail-closed » :
seule la chaîne exacte `true` l'active, toute autre valeur (`false`, `1`,
`yes`, variable absente) la laisse désactivée.

Le frontend interroge `GET /api/admin/maintenance/reset-data/available` pour
afficher ou masquer le bouton. Ce n'est qu'un confort d'affichage : la décision
est prise par le backend, un appel direct à l'API sans la bonne variable est
refusé.

### Usage prévu

Réservé au **reset initial des données de test, avant le démarrage réel de la
plateforme**. Une fois des comptes agents et des transferts réels créés,
l'opération doit rester désactivée. La procédure complète, avec les vérifications
et la remise à `false`, est décrite dans `transfertPro-infra/RUNBOOK_PRODUCTION.md`
(section 27).

### Journalisation

Le projet n'a pas de table d'audit. L'opération est donc tracée sur la sortie
console, sans donnée sensible (ni email, ni téléphone, ni mot de passe) :

```text
[AUDIT] action=RESET_TRANSACTIONAL_DATA actor=<uuid> role=ADMIN outcome=SUCCESS date=<ISO> { cashCollections: 0, transfers: 12, agents: 3 }
```

Un `outcome=FAILED` est écrit si la transaction échoue.

## Frontend

Ce backend est utilisé par le frontend TransferePro (`transferePro_web`, React + Vite). En développement, le frontend proxie ses appels `/api` vers `http://localhost:3000` — assurez-vous que l'API tourne avant de lancer le frontend. 

cd transferePro_web
npm install
npm run dev          # sur http://localhost:5173
