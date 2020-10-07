import * as Koa from 'koa';

export function checkOriginAgainstWhitelist(whitelist: string[]) {
    return (ctx: Koa.Context) => {
        const requestOrigin = ctx.headers.origin as string;
        if (!whitelist.includes(requestOrigin)) {
            return ctx.throw(`${requestOrigin} is not a valid origin.`);
        }
        return requestOrigin;
    };
}
