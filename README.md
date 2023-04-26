## Development server

Run `npm run start-dev` to start the dev server. Make sure to first include a `.env` file in the root of your project with the required values or startup with fail. Development also requires running [XIV Raid Hub](https://github.com/smithk58/xiv-raid-hub) to see the UI. May also require [XIV Raid Hub Bot](https://github.com/smithk58/xiv-raid-hub-bot) if you're touching functionality that requires the bot, such as alarms.

## Build

Run `npm run build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Docker Image

You can build a production ready docker image by running `docker build -t xiv-raid-hub-api .` on the root of the project.

To test an image locally you can do the following:
* Add a `.env` file under root with the following content:
```
APP_SECRET_KEY=<app secret>
DISCORD_CLIENT_ID=<valid discord client ID, assuming you want to be able to login>
DISCORD_CLIENT_SECRET=<valid discord client secret, assuming you want to be able to login>
FRONTEND_BASE_URL=http://localhost:4200
BACKEND_BASE_URL=http://localhost:3000
BOT_BASE_URL=http://localhost:3001
DB_URL=<valid DB connection>
XIV_RAID_HUB_BOT_API_KEY=<valid bot API key, assuming you want to connect to the bot>
ALLOWED_ORIGINS=["http://localhost:4200", "http://localhost:3001"]
PORT=3000

```
* Run the following command from the root of this project `docker run -p 3000:3000 --env-file .env xiv-raid-hub-api`.
* After executing docker run the server should be available. In particular you can combine it with these similar steps with the frontend project to see the results.

## Lint

Run `npm run lint` to run the projects linter.

## Environment Variables
Put these values in a [`.env`](https://www.npmjs.com/package/dotenv) file or feed them in as environment variables to the
project however your hosting platform supports it. 
* `NODE_DEV` = Set to`dev` when doing development, otherwise can be ignored.
* `APP_SECRET_KEY` - A large random key, used for securing cookies.
* `DISCORD_CLIENT_ID` - The OAuth2 client ID for a [discord app](https://discord.com/developers/applications). Will be used when authenticating users for this application via discords oauth.
* `DISCORD_CLIENT_SECRET` - The secret for the above ID.
* * Be sure to add this applications auth URL to your discord applications redirects in the oAuth section. Otherwise discord will not let you
authenticate (e.g. `https://<your-prod-domain>.com/connect/discord/callback`, or `http://localhost:3000/connect/discord/callback` for development).
* `DB_URL` - A connection string for a postgres DB to manage the application. The DB itself will be automatically managed by TypeORM.
* `BACKEND_BASE_URL` - The base URL for the backend (e.g. `http://localhost:3000` for local dev, or `https://<your domain>.com` for production).
* `FRONTEND_BASE_URL` - Only needs to be set when doing local development with your frontend in its own webserver.
* `BOT_BASE_URL` - The base URL for the bot. Only needed if doing operations that must talk to the bot. (e.g. set to `http://localhost:3001` for local dev, or https://<your bots domain>.com for production).
* `XIV_RAID_HUB_BOT_API_KEY` - A valid API key for the bots API. Only needed if running/interacting with the bot locally.
* `FFLOGS_CLIENT_ID` - A valid FFLogs API client ID. Only needed for features that interact with the FFLogs API (e.g. getting expansions, zones, reports).
* `FFLOGS_SECRET` - The secret for the above ID.
* `ALLOWED_ORIGINS` - Restricts webservers allowed origins. Only applied when in production mode. Expects a JSON array of origins (e.g. ["https://www.xivraidhub.com", "https://bot.xivraidhub.com"]).
### For Development
You can paste the below snippet in a `.env` file in the root of your project. This should never be committed. You must fill in
the missing values and/or delete any values that aren't needed for your local development.
```
NODE_ENV=development
APP_SECRET_KEY=<large random key, used for securing cookies>
DISCORD_CLIENT_ID=<your discord client app id, required to login/get a session>
DISCORD_CLIENT_SECRET=<your discord client app secret, required to login/get a session>
FFLOGS_CLIENT_ID=<your fflogs client ID, if your using fflogs related features>
FFLOGS_SECRET=<your fflogs secret, if your using fflogs related features>
BACKEND_BASE_URL=http://localhost:3000
FRONTEND_BASE_URL=http://localhost:4200
BOT_BASE_URL=http://localhost:3001
DB_URL=<db connection URL, required for the backend to function at all>
XIV_RAID_HUB_BOT_API_KEY=<the API key you set in the bots environment variables, required for features that interact with the bot>
```
Sometimes you may want to test the application locally as if it's in production (i.e. the backend and frontend together in
a docker image):
1. Make the below changes to your `.env` file
```
NODE_ENV=production
ALLOWED_ORIGINS=["http://localhost:3000", "http://localhost:3001"]
```
2. Paste the `xiv-raid-hub` folder from your frontends `dist` folder into this projects `dist` folder.
3. 
### For Production
You should run the project in production with a docker image generated by this project. The docker image includes both the 
frontend and the backend. The frontend it includes is the latest commit from the master branch of the frontend project.

The below environment variables **must** be passed to the docker image for it to run correctly in production. Details on
these variables expected values can be found at the top of the Environment Variables section of the readme.
* `APP_SECRET_KEY`
* `DISCORD_CLIENT_ID`
* `DISCORD_CLIENT_SECRET`
* `DB_URL`
* `BACKEND_BASE_URL`
* `BOT_BASE_URL`
* `XIV_RAID_HUB_BOT_API_KEY`
* `ALLOWED_ORIGINS`

### FFLogs GraphQL Stuff
If you run into issues with FFLogs related queries the `schema.graphql` file may be outdated. The file is defined/maintained by FFLogs, so the one saved in this codebase could become outdated at any time.

I use a plugin (GraphQL) to fetch it using the information in the `.graphqlconfig` file. If you do something similar you will first need to replace `<token>` in file with a valid token. Information on obtaining a token can be found in the FFlogs docs: https://www.fflogs.com/api/docs 

If you update the `schema.graphql` file be sure to run `npm run fflogs-types` to regenerate the typescript type definitions (`fflogs-types.d.ts`) as well.
