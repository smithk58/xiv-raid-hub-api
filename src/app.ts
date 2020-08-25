import * as Koa from 'koa';
import * as HttpStatus from 'http-status-codes';
import * as Helmet from 'koa-helmet';
import * as Logger from 'koa-logger';
import * as Cors from '@koa/cors';
import * as BodyParser from 'koa-bodyparser';
const respond = require('koa-respond');
const grant = require('grant').koa();
const session = require('koa-session');
import apiRouter from "./routes";
require('dotenv').config();

const app: Koa = new Koa();
app.keys = [process.env.APP_SECRET_KEY];
// Security
app.use(Helmet());

// Logger and CORS for local dev
if (process.env.NODE_ENV === 'development') {
    app.use(Logger());
    app.use(Cors({credentials: true}));
}

// Use koa-session for session management
app.use(session(app));

// Use grant for oauth 2 handling
const baseURL = process.env.BACKEND_BASE_URL;
const oAuthConfig = require('./config.json');
oAuthConfig.defaults.origin = baseURL;
oAuthConfig.discord.callback = process.env.FRONTEND_BASE_URL ? process.env.FRONTEND_BASE_URL : baseURL;
oAuthConfig.discord.secret = process.env.DISCORD_CLIENT_SECRET;
app.use(grant(oAuthConfig));

// Let's us parse JSON requests
app.use(BodyParser({
    enableTypes: ['json'],
    jsonLimit: '5mb',
    strict: true,
    onerror: function (err, ctx) {
        ctx.throw('body parse error', 422)
    }
}));

// Easier responses https://www.npmjs.com/package/koa-respond
app.use(respond());

// Generic error handling middleware.
app.use(async (ctx: Koa.Context, next: () => Promise<any>) => {
    try {
        await next();
    } catch (error) {
        ctx.status = error.statusCode || error.status || HttpStatus.INTERNAL_SERVER_ERROR;
        error.status = ctx.status;
        ctx.body = {error};
        ctx.app.emit('error', error, ctx);
    }
});

// Routes
app.use(apiRouter.routes());
app.use(apiRouter.allowedMethods());

// Application error logging.
app.on('error', console.error);
export default app;
