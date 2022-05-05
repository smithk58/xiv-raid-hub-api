## Development server

Run `npm run start-dev` to start the dev server. Make sure to first include a `.env` file in the root of your project with the required values or startup with fail. Development also requires running [XIV Raid Hub](https://github.com/smithk58/xiv-raid-hub) to see the UI. May also require [XIV Raid Hub Bot](https://github.com/smithk58/xiv-raid-hub-bot) if you're touching functionality that requires the bot, such as alarms.

## Build

Run `npm run build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Production

The application can be run in production by executing the `build` step, followed by the `npm run start` script. Note that
you should make sure `NODE_ENV` isn't 'dev' so the compiled typeORM entities are used (see ormconfig.js).

## Lint

Run `npm run lint` to run the projects linter.

## Environment Variables

Put these values in a [`.env`](https://www.npmjs.com/package/dotenv) file or in the projects environment variables.

### For Development
* `NODE_DEV` = Set to`dev`.
* `APP_SECRET_KEY` - A large random key, used for securing cookies.
* `DISCORD_CLIENT_ID` - The OAuth2 client ID for a [discord app](https://discord.com/developers/applications). Will be used when authenticating users for this application via discords oauth. In the Redirects section of the discord OAuth configuration make sure to add `http://localhost:3000/connect/discord/callback` as well.
* `DISCORD_CLIENT_SECRET` - The secret for the above ID.
* `DB_URL` - A connection string for a postgres DB to manage the application. The DB itself will be automatically managed by TypeORM.
* `BACKEND_BASE_URL` - Set to `http://localhost:3000`.
* `FRONTEND_BASE_URL` - Set to `http://localhost:4200`.
* `BOT_BASE_URL` - Set to `http://localhost:3001` if running/interacting with the bot locally.
* `XIV_RAID_HUB_BOT_API_KEY` - A valid API key for the bots API. Only needed if running/interacting with the bot locally.
* `FFLOGS_CLIENT_ID` - A valid FFLogs API client ID. Only needed for features that interact with the FFLogs API (e.g. getting expansions, zones, reports).
* `FFLOGS_SECRET` - The secret for the above ID.

### For Production
* `APP_SECRET_KEY` - A large random key, used for securing cookies.
* `DISCORD_CLIENT_ID` - The OAuth2 client ID for a [discord app](https://discord.com/developers/applications). Will be used when authenticating users for this application via discords oauth. In the Redirects section of the discord OAuth configuration make sure to add `http://localhost:3000/connect/discord/callback` as well.
* `DISCORD_CLIENT_SECRET` - The secret for the above ID.
* `DB_URL` - A connection string for a postgres DB to manage the application. The DB itself will be automatically managed by TypeORM.
* `BACKEND_BASE_URL` - The domain this project is hosted on. Defaults to `https://api.xivraidhub.com`.
* `FRONTEND_BASE_URL` - The domain your [XIV Raid Hub](https://github.com/smithk58/xiv-raid-hub) is hosted on. Defaults to `https://www.xivraidhub.com`.
* `BOT_BASE_URL` - The domain your [XIV Raid Hub Bot](https://github.com/smithk58/xiv-raid-hub-bot) is hosted on. Defaults to `https://bot.xivraidhub.com`.
* `XIV_RAID_HUB_BOT_API_KEY` - A valid API key for the bots API.
* `ALLOWED_ORIGINS` - Restricts webservers allowed origins while running production. Expects a JSON array of origins. Defaults to ["https://www.xivraidhub.com", "https://bot.xivraidhub.com"].
* `FFLOGS_CLIENT_ID` - A valid FFLogs API client ID.
* `FFLOGS_SECRET` - The secret for the above ID.

### FFLogs GraphQL Stuff
If you run into issues with FFLogs related queries the `schema.graphql` file may be outdated. The file is defined/maintained by FFLogs, so the one saved in this codebase could become outdated at any time.

I use a plugin (GraphQL) to fetch it using the information in the `.graphqlconfig` file. If you do something similar you will first need to replace `<token>` in file with a valid token. Information on obtaining a token can be found in the FFlogs docs: https://www.fflogs.com/api/docs 

If you update the `schema.graphql` file be sure to run `npm run fflogs-types` to regenerate the typescript type definitions (`fflogs-types.d.ts`) as well.
