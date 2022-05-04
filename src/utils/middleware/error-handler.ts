/* eslint-disable */
import * as Koa from 'koa';
import { StatusCodes } from 'http-status-codes';

export async function handleError(ctx: Koa.Context, next: () => Promise<any>) {
    try {
        await next();
    } catch (error) {
        const isValidatorError = Array.isArray(error) && error.length > 0 && error[0].constraints;
        if (isValidatorError) {
            ctx.status = 400;
            // Return the first error found
            const firstErrorBatch = error[0].constraints;
            const errorKeys = Object.keys(firstErrorBatch);
            ctx.body = firstErrorBatch[errorKeys[0]];
        } else {
            ctx.status = error.statusCode || error.status || StatusCodes.INTERNAL_SERVER_ERROR;
            ctx.body = error.message || error.toString();
        }
        ctx.app.emit('error', error, ctx);
    }
}
