## Development server

Run `npm run start-dev` to start the dev server.

## Build

Run `npm run build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Production

The application can be run in production by executing the `build` steps, followed by the `npm run start` script.

## Lint

Run `npm run lint` to run the projects linter.

## Environment Variables

Put these values in a [`.env`](https://www.npmjs.com/package/dotenv) file or in the projects environment variables.

### Required

* `APP_SECRET_KEY` - A large random key, used for securing cookies.
* `DISCORD_CLIENT_ID` - The client ID for a discord app. Will be used when authenticating users for this application via discords oauth.
* `DISCORD_CLIENT_SECRET` - The secret for the above ID.
* `DB_URL` - A connection string for a postgres DB to manage the application. The DB itself will be automatically managed by TypeORM.
### Optional

* `NODE_DEV` = `dev`, for development, otherwise assumes production
* `BACKEND_BASE_URL` - Sent to discord as the origin when authenticating. Defaults to `https://api.xivraidhub.com`.
* `BOT_BASE_URL` - Override for base URL to use for the bots API. Defaults to `https://bot.xivraidhub.com`.
* `XIV_RAID_HUB_BOT_API_KEY` - A valid API key for the bots API. Only needed if you need one of the features that interacts with the bot (e.g. alarms).
* `FFLOGS_CLIENT_ID` - A valid FFLogs API client ID. Only needed for features that interact with the FFLogs API (e.g. getting expansions, classes, zones, reports).
* `FFLOGS_SECRET` - The secret for the above ID.
* `FRONTEND_BASE_URL` - Users will be redirected here after authenticating with discord. Defaults to `https://www.xivraidhub.com`.
* `ALLOWED_ORIGINS` - Restricts webservers allowed origins while running production. Expects a JSON array of origins. Defaults to `["https://www.xivraidhub.com", "https://bot.xivraidhub.com"]`.

### FFLogs GraphQL Stuff
If you run into issues with FFLogs related queries the `schema.graphql` file may be outdated. The file is defined/maintained by FFLogs, so the one saved in this codebase could become outdated at any time.

I use a plugin (GraphQL) to fetch it using the information in the `.graphqlconfig` file. If you do something similar you will first need to replace `<token>` in file with a valid token. Information on obtaining a token can be found in the FFlogs docs: https://www.fflogs.com/api/docs 

If you update the `schema.graphql` file be sure to run `npm run fflogs-types` to regenerate the typescript type definitions (`fflogs-types.d.ts`) as well.
