import * as Koa from 'koa';
import * as HttpStatus from 'http-status-codes';

export async function handleError(ctx: Koa.Context, next: () => Promise<any>) {
    try {
        await next();
    } catch (error) {
        // TODO hacky, need better way to detect validator errors.
        const isValidatorError = Array.isArray(error) && error.length > 0 && error[0].constraints;
        if (isValidatorError) {
            ctx.status = 400;
            ctx.body = error.toString();
        } else {
            ctx.status = error.statusCode || error.status || HttpStatus.INTERNAL_SERVER_ERROR;
            ctx.body = error.message || error.toString();
        }
        ctx.app.emit('error', error, ctx);
    }
}
