# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Breakin Clays API — an Express + MongoDB (Mongoose) backend serving two separate clients from one codebase: an **admin panel** and a **mobile/app** client. It uses JWT auth (passport-jwt), Joi validation, AWS S3/SES, Firebase push notifications, and Puppeteer for PDF generation.

## Commands

```bash
yarn dev                  # start dev server (nodemon, NODE_ENV=development), reads .env
yarn start                # start production via pm2 (ecosystem.config.json)
yarn test                 # run full jest suite (runInBand, detectOpenHandles)
yarn test:watch           # jest --watchAll (runInBand)
yarn coverage              # jest --coverage
npx jest tests/unit/models/user.model.test.js   # run a single test file
npx jest -t "name of test" # run tests matching a name
yarn lint / yarn lint:fix
yarn prettier / yarn prettier:fix
yarn docker:dev / docker:prod / docker:test
```

There is no committed ESLint/Prettier config file at the repo root despite the scripts referencing them — check before relying on `yarn lint`.

Environment variables are validated at startup via Joi in `src/config/config.js` (missing required vars throw immediately). Copy `.env.example` to `.env` before running anything. In test env, `-test` is appended to the Mongo DB name (`src/config/config.js`), so tests never touch the dev database.

## Architecture

### Admin vs. App split

Nearly every layer (routes, controllers, services, validations) is split into two parallel trees:

```
src/{controllers,services,validations}/admin/...   # admin panel endpoints
src/{controllers,services,validations}/app/...     # mobile app endpoints
```

Routes mount under `/v1/admin/*` and `/v1/app/*` respectively (`src/routes/v1/index.js` → `src/routes/v1/admin/index.js`, `src/routes/v1/app/index.js`). Some domains (e.g. gun-related features) exist only on one side (`gunDetail` = admin, `gunSafe`/`gunRequest` = app-facing counterparts), so don't assume symmetry — check both `admin/` and `app/` index files before assuming a resource is missing.

A few legacy top-level files (`src/controllers/auth.controller.js`, `src/controllers/user.controller.js`, `src/routes/v1/auth.route.js`, `src/routes/v1/user.route.js`) predate the admin/app split; new work should go into the admin/app subdirectories, not these.

### Request flow

`route → validate(schema) middleware → auth() middleware → controller → service → model`

- Every route uses `validate(validations.xxx)` (`src/middlewares/validate.js`) with Joi schemas from `src/validations/{admin,app}/*.validation.js`.
- `auth(...requiredRights)` (`src/middlewares/auth.js`) wraps passport-jwt; roles/rights are defined in `src/config/roles.js` (currently only `user` and `admin`, with `admin` granted `getUsers`/`manageUsers`). Calling `auth()` with no args just requires a valid JWT; deleted users (`isDeleted`) are rejected even with a valid token.
- Controllers are thin: they call a service function and reply via `res.sendJSONResponse(code, status, message, data)`, a helper attached to `express.response` in `src/app.js`. Always respond through this helper, not raw `res.json`, to keep the `{ code, status, message, data }` envelope consistent.
- Business logic and Mongoose queries live in services (`src/services/{admin,app}/*.service.js`), aggregated via each folder's `index.js` barrel.
- User-facing success/error strings are centralized in `src/utils/message.js` (`sucessfull_message` / likely an error-message export) — reuse existing keys or add new ones there rather than inlining strings in controllers.

### Models

Registered centrally in `src/models/index.js`. All schemas use two shared plugins (`src/models/plugins/`):
- `toJSON.plugin.js` — strips `_id`/`__v`/timestamps and any field marked `{ private: true }`, replacing `_id` with `id` in JSON output.
- `paginate.plugin.js` — adds a `Model.paginate(filter, options)` static supporting `sortBy` (`field:asc|desc`, comma-separated), `page`, `limit`, and dotted `populate` chains.

Configuration-level enum/constant lists shared across models and validations (gun parts, event/score types, statuses, shot types, categories, etc.) live in `src/config/config.js` and are exported alongside the env-derived config — check there before hardcoding an enum in a model or validation schema.

### Error handling & logging

`src/middlewares/error.js`: `errorConverter` normalizes any thrown error into an `ApiError` (`src/utils/ApiError.js`) **and persists an error entry to the `Log` model** (URL, headers, IP, timing, stack) before handing off to `errorHandler`, which strips internal details in production for non-operational errors. Throw `ApiError(httpStatus.X, message)` from services for expected failure cases so they're treated as operational (won't be masked in production).

### Cron jobs

Registered in `src/crons/index.js` (loaded once via `require('./crons')` in `src/app.js`) using `node-cron`. Three jobs run daily: day-of-event notifications, day-before-event notifications, and auto-deletion of old events/scores. Add new scheduled jobs by creating a module in `src/crons/` and registering it here.

### Notifications, email, files

- Push notifications: `src/utils/pushNotification.js` (Firebase Admin).
- Email: `src/services/email.service.js` + AWS SES (`src/utils/ses.js`) and/or SMTP via nodemailer, with Handlebars templates in `src/template/`.
- File storage: AWS S3 via `src/utils/aws.js`; bucket sub-folders per feature are configured via env vars (see `.env.example`, e.g. `AWS_BUCKET_PROFILE_FOLDER`, `AWS_BUCKET_EVENT_FOLDER`, etc.).
- PDF generation: `src/utils/pdfUtils.js` (Puppeteer), gated by `PDF_CONDITIONAL_CATEGORIES` in config.

### API docs

Swagger UI served at `/v1/docs`, defined via `src/docs/swaggerDef.js` and `src/routes/v1/docs.route.js`.

## Tests

Jest runs `-i` (in-band) with `detectOpenHandles`; `tests/utils/setupTestDB.js` handles DB setup/teardown for integration tests. Fixtures live in `tests/fixtures/`. Coverage excludes `src/config` and `src/app.js` (see `jest.config.js`). Existing test coverage is thin relative to `src/` — most controllers/services/admin routes have no tests yet, so don't assume a test exists just because the feature does.
