import * as Koa from 'koa';
import * as HttpStatus from 'http-status-codes';
import * as Helmet from 'koa-helmet';
import * as Logger from 'koa-logger';
import * as Cors from '@koa/cors';
import * as BodyParser from 'koa-bodyparser';

import apiRouter from "./routes";
require('dotenv').config();

const app: Koa = new Koa();

app.use(Helmet());
app.use(Cors());

if (process.env.NODE_ENV === 'development') {
    app.use(Logger())
}

app.use(BodyParser({
    enableTypes: ['json'],
    jsonLimit: '5mb',
    strict: true,
    onerror: function (err, ctx) {
        ctx.throw('body parse error', 422)
    }
}));

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
