import * as Koa from 'koa';

export const checkOriginAgainstWhitelist = (whitelist: string[]) => {
    return (ctx: Koa.Context) => {
        const requestOrigin = ctx.headers.origin;
        if (!whitelist.includes(requestOrigin)) {
            return ctx.throw(`${requestOrigin} is not a valid origin.`);
        }
        return requestOrigin;
    };
}
