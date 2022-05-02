import * as Koa from 'koa';
import * as Helmet from 'koa-helmet';
import * as Logger from 'koa-logger';
import * as Cors from '@koa/cors';
import * as bodyParser from 'koa-bodyparser';
import * as session from 'koa-session';
import 'reflect-metadata'; // required for class-transformer and typeorm
const respond = require('koa-respond');
const grant = require('grant').koa();
import apiRouter from './routes';
import { createConnection, DataSource } from 'typeorm';
import { checkOriginAgainstWhitelist } from './utils/middleware/origin-whitelist';
import { handleError } from './utils/middleware/error-handler';
import { Container } from 'typescript-ioc';
import { EnvService } from './services/EnvService';
require('dotenv').config();

const envService: EnvService = Container.get(EnvService);

const app: Koa = new Koa();
app.keys = [envService.appSecretKey];
// Security
app.use(Helmet());
// Generic error handling middleware.
app.use(handleError);
// Logger and CORS for local dev
if (envService.isDevelopment) {
    app.use(Logger());
    app.use(Cors({credentials: true}));
} else {
    app.use(Cors({credentials: true, origin: checkOriginAgainstWhitelist(envService.allowedOrigins)}));
}

// Use koa-session for session management
app.use(session(app));

// Use grant for oauth 2 handling
const oAuthConfig = require('./oauth-config.json');
oAuthConfig.defaults.origin = envService.backendBaseURL;
// Discord oauth
oAuthConfig.discord.callback = '/api/session/login';
oAuthConfig.discord.key = envService.discordClientID;
oAuthConfig.discord.secret = envService.discordClientSecret;
// FFlogs oauth (for private reports)
oAuthConfig.fflogs.callback = '/api/session/fflogs';
oAuthConfig.fflogs.key = envService.fflogsClientId;
oAuthConfig.fflogs.secret = envService.fflogsClientSecret;
app.use(grant(oAuthConfig));

// Let's us parse JSON requests
app.use(bodyParser({
    enableTypes: ['json'],
    onerror: (err, ctx) => {
        ctx.throw('body parse error', 422);
    }
}));

// Easier responses https://www.npmjs.com/package/koa-respond
app.use(respond());

// Create connection to DB
createConnection().then(() => {
    console.log('DB connection successful');
    // Routes
    app.use(apiRouter.routes());
    app.use(apiRouter.allowedMethods());
}, (err) => {
    console.log('DB connection failed', err);
});

// Application error logging.
app.on('error', console.error);
export default app;
