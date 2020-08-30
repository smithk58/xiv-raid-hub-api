import * as Router from '@koa/router';
import { DefaultState, Context, ParameterizedContext } from 'koa';
import { DiscordApi } from "../api-wrappers/discord-api";

import { FESession } from "../models/FESession";
import { APIUser } from "discord-api-types/default";

// Needed for context type shenanigans
export type RContext = ParameterizedContext<DefaultState, Context & Router.RouterParamContext<DefaultState, Context>>;

const routerOpts: Router.RouterOptions = {prefix: '/session'};
const sessionRouter: Router = new Router<DefaultState, Context>(routerOpts);
sessionRouter.get('/', async (ctx: RContext) => {
    let user: APIUser;
    // Attempt to resolve the discord user if we have an access token
    const oauthGrant = ctx.session.grant;
    if (oauthGrant) {
        user = await DiscordApi.getUser(oauthGrant.response.access_token).catch(error => {
            // TODO if 401 attempt token refresh and regrab user, if fails again make them relog in
            // TODO if not 401 probably bubble the error to the UI, app still usable but we can't auth the user and let them know.
        });
    }
    ctx.ok(new FESession(user))
});
sessionRouter.get('/logout', async (ctx: RContext) => {
    ctx.session = null;
    ctx.send(200, {});
});
export default sessionRouter.routes();
