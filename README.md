## Development server

Run `nodemon` or `npm run start-dev` to start the dev server.

## Build

Run `npm run build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Production

The application can be run in product by executing the `build` steps, followed by the `main` script.

## Lint

Run `npm run lint` to run the projects linter.

## Environment Variables

Put these values in a [`.env`](https://www.npmjs.com/package/dotenv) file or in the projects environment variables.

### Required

* `APP_SECRET_KEY` - A large random key, used for securing cookies.
* `DISCORD_CLIENT_SECRET` - The secret key for a discord app. Will be used when authentication users for this application via discords oauth.
* `DB_URL` - A connection string for a postgres DB to manage the application.
* `XIV_RAID_HUB_BOT_API_KEY` - A valid API key for the bots API.
### Optional

* `NODE_DEV` = `development`, for dev, otherwise assumes production
* `BACKEND_BASE_URL` - Sent to discord as the origin when authentication. Defaults to `https://api.xivraidhub.com`.
* `BOT_BASE_URL` - override for base URL to use for the bots API. Defaults to `https://bot.xivraidhub.com`.
* `FRONTEND_BASE_URL` - Users will be redirected here after authenticating with discord. Defaults to `https://www.xivraidhub.com`.
* `ALLOWED_ORIGINS` - Restricts webservers origin while running production. Expects a JSON array of origins. Defaults to `["https://www.xivraidhub.com", "https://bot.xivraidhub.com"]`.
