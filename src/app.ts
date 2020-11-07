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
import { createConnection } from 'typeorm';
import { checkOriginAgainstWhitelist } from './utils/middleware/origin-whitelist';
import { handleError } from './utils/middleware/error-handler';
require('dotenv').config();

const app: Koa = new Koa();
app.keys = [process.env.APP_SECRET_KEY];
// Security
app.use(Helmet());
// Generic error handling middleware.
app.use(handleError);
// Logger and CORS for local dev
if (process.env.NODE_ENV === 'development') {
    app.use(Logger());
    app.use(Cors({credentials: true}));
} else {
    const whitelist = process.env.ALLOWED_ORIGINS ? JSON.parse(process.env.ALLOWED_ORIGINS) : ['https://www.xivraidhub.com', 'https://bot.xivraidhub.com'];
    app.use(Cors({credentials: true, origin: checkOriginAgainstWhitelist(whitelist)}));
}

// Use koa-session for session management
app.use(session(app));

// Use grant for oauth 2 handling
const baseURL = process.env.BACKEND_BASE_URL || 'https://api.xivraidhub.com';
const oAuthConfig = require('./config.json');
oAuthConfig.defaults.origin = baseURL;
oAuthConfig.discord.callback = '/api/session/login';
oAuthConfig.discord.secret = process.env.DISCORD_CLIENT_SECRET;
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
createConnection();
// Routes
app.use(apiRouter.routes());
app.use(apiRouter.allowedMethods());

// Application error logging.
app.on('error', console.error);
export default app;
