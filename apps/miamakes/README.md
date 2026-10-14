# Mia Makes

A kitchen site for Mia's recipes, built on WebEngine. This is the week-1 foundation: recipes can be listed, opened, created, edited, and deleted. Accounts, photo uploads, cookbooks, decorative things, and deployment come later. The aim is to have the real site ready by Christmas 2026.

The old prototype (Create React App, Express, MongoDB) was used only as a reference for the recipe shape. This app does not port that code.

## Layout

- `front/` — Sig.js pages and Juice styling (`@citrusworx/sigjs`, `@citrusworx/juiceui`)
- `back/` — Seltzer HTTP API and Nectarine Postgres (`@citrusworx/seltzer`, `@citrusworx/nectarine`)

## Local dev

From the WebEngine repo root, after `yarn install`:

```bash
# API on http://localhost:3010
yarn workspace @citrusworx/miamakes-back dev

# Site on http://localhost:5174 (proxies /api to the API)
yarn workspace @citrusworx/miamakes dev
```

With no `PG_*` variables set, the API keeps a few seed recipes in memory. Creating a recipe in the form updates that process, and the list and detail pages read it back. Restarting the API restores the seed list.

## Environment

Copy `back/.env.example` to `back/.env` when you want Postgres. Nectarine reads the key names from `back/nectarine.config.yaml`:

| Variable | Purpose |
| --- | --- |
| `PG_USER` | Postgres user |
| `PG_PASS` | Postgres password |
| `PG_HOST` | Postgres host |
| `PG_PORT` | Postgres port |
| `PG_DB` | Database name |
| `PORT` | API port, default `3010` |
| `CORS_ORIGIN` | Optional exact browser origin if the site is not using the Vite proxy |
| `REQUIRE_DATABASE` | Set to `1` to refuse the in-memory seed fallback |
| `ALLOW_SEED_FALLBACK` | Set to `1` to allow memory seed even when `NODE_ENV=production` |
| `NECTARINE_CONFIG` | Optional path to the YAML config |
| `MIAMAKES_API_URL` | Optional Vite proxy target, default `http://localhost:3010` |
| `VITE_API_BASE` | Optional absolute API prefix for the browser. Leave empty when Vite proxies `/api`. |

All five `PG_*` values must be set together. A partial set fails boot. Production (`NODE_ENV=production`) requires Postgres unless `ALLOW_SEED_FALLBACK=1`.

Example local database:

```bash
createdb miamakes
```

Then put the matching `PG_*` values in `back/.env`. `tsx` does not load `.env` by itself; export the variables or use your process manager before `dev` / `migrate`.

## Migrations

Schema lives in `back/src/schemas/recipe/recipeSchema.yml`. Nectarine compiles that file to `CREATE TABLE` / indexes. There is no SQL in the app.

On API boot, when Postgres credentials resolve, the server connects, runs migrations, and seeds the sample recipes if the table is empty.

To migrate without starting the server:

```bash
export PG_USER=miamakes PG_PASS=change-me-postgres PG_HOST=localhost PG_PORT=5432 PG_DB=miamakes
yarn workspace @citrusworx/miamakes-back migrate
```

Later renames, drops, and type changes go in `back/src/db/migrations/*.yml` as Nectarine migration documents. The initial table is the schema file, not a hand-written SQL script. `ingredients` and `steps` are protected JSONB columns.

`category` and `before_you_begin` live on that schema. `category` is a short slug (`salads`, `entrees`, `appetizers`, and any later shelf), not a closed enum, so a new shelf does not need a migration. On an existing database, Nectarine's migrate runner adds the columns with `ADD COLUMN IF NOT EXISTS` from the schema. Versioned migration files stay for rename, drop, and type change. There is still no SQL in the app.

## Recipe API

| Method | Path | Named query |
| --- | --- | --- |
| GET | `/api/recipes` | `listRecipes` |
| GET | `/api/recipes/slug/:slug` | `bySlug` |
| GET | `/api/recipes/:id` | `byId` |
| GET | `/api/recipes/category/:category` | `listByCategory` |
| POST | `/api/recipes` | `createRecipe` |
| PUT | `/api/recipes/:id` | `updateRecipe` |
| DELETE | `/api/recipes/:id` | `deleteRecipe` |

`name` is required. Ingredients and steps are JSON arrays of strings, stored as JSONB. Times are whole minutes. `category` defaults to `entrees` when a write omits it. `before_you_begin` is the note above the steps. `photo_url`, `author_id`, and `cookbook_id` are optional seams. If a PUT omits them, the saved values stay.

## Checks

```bash
yarn workspace @citrusworx/miamakes-back test
yarn workspace @citrusworx/miamakes-back typecheck
yarn workspace @citrusworx/miamakes typecheck
```

## Seams left for later

- `author_id` — accounts, still no auth and no password storage
- `photo_url` — uploads, not a file pipeline
- `cookbook_id` — cookbooks, no foreign key until that table exists. Recipe shelves use `category`, which is already a column.
- Decorative things (gardening, crafts) — named in the home hero, not a resource yet
- Posts — hinted by the old prototype, not modeled yet

## Host execute

Named SQL lives in `recipeQueries.yml`. The route execute validates the body, mints ids, keeps slugs unique, and falls back to the in-memory list when Postgres is unset. Ingredient and step arrays are passed through. Schema `jsonb` columns stamp `::jsonb` on those binds, and the Postgres adapter encodes the arrays. `updateRecipe` is one `UPDATE … RETURNING *` — the handler does not read the row back with `byId`. No SQL is written in the app.

## Roadmap to Christmas 2026

1. **This week** — recipe schema, CRUD, and the kitchen pages.
2. **Accounts** — sign-in for Mia, fill `author_id`, still no shared passwords in the repo.
3. **Photos** — upload into `photo_url`.
4. **Cookbooks** — real `cookbook_id` foreign key and a few groupings.
5. **Decorative things** — gardening and crafts as their own resource, not mixed into recipes.
6. **Stories** — short posts beside the recipes.
7. **Polish** — search, a print-friendly recipe page, empty states.
8. **Deploy** — hosting, domain, and backups.
9. **Mia's recipes** — real dishes and her words, replacing the samples.
10. **Freeze** — no new features the week of Christmas.
