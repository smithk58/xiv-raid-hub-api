import * as Koa from 'koa';
import * as HttpStatus from 'http-status-codes';
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

require('dotenv').config();

const app: Koa = new Koa();
app.keys = [process.env.APP_SECRET_KEY];
// Security
app.use(Helmet());

// Logger and CORS for local dev
if (process.env.NODE_ENV === 'development') {
    app.use(Logger());
    app.use(Cors({credentials: true}));
} else {
    app.use(Cors({origin: process.env.FRONTEND_BASE_URL, credentials: true}));
}

// Use koa-session for session management
app.use(session(app));

// Use grant for oauth 2 handling
const baseURL = process.env.BACKEND_BASE_URL;
const oAuthConfig = require('./config.json');
oAuthConfig.defaults.origin = baseURL;
oAuthConfig.discord.callback = '/api/session/login';
oAuthConfig.discord.secret = process.env.DISCORD_CLIENT_SECRET;
app.use(grant(oAuthConfig));

// Let's us parse JSON requests
app.use(bodyParser({ // TODO maybe not needed w/ transformAndValidate being used
    enableTypes: ['json'],
    onerror: (err, ctx) => {
        ctx.throw('body parse error', 422);
    }
}));

// Easier responses https://www.npmjs.com/package/koa-respond
app.use(respond());

// Generic error handling middleware.
app.use(async (ctx: Koa.Context, next: () => Promise<any>) => {
    try {
        await next();
    } catch (error) {
        // TODO hacky, need better way to detect validator errors.
        const isValidatorError = Array.isArray(error) && error.length > 0 && error[0].constraints;
        if (isValidatorError) {
            ctx.status = 400;
            ctx.body = error.toString();
            // TODO Better for frontend to specifically parse these apart, but this is decent enough for now
        } else {
            ctx.status = error.statusCode || error.status || HttpStatus.INTERNAL_SERVER_ERROR;
            ctx.body = error.message || error.toString();
        }

        ctx.app.emit('error', error, ctx);
    }
});
// Create connection to DB
createConnection();
// Routes
app.use(apiRouter.routes());
app.use(apiRouter.allowedMethods());

// Application error logging.
app.on('error', console.error);
export default app;
