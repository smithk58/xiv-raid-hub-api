import * as Router from '@koa/router';
import { DefaultState, Context, ParameterizedContext } from 'koa';
import { DiscordApi } from "../api-wrappers/discord-api";

import { FESession } from "../models/FESession";

// Needed for context type shenanigans
export type RContext = ParameterizedContext<DefaultState, Context & Router.RouterParamContext<DefaultState, Context>>;

const routerOpts: Router.RouterOptions = {prefix: '/user'};
const userRouter: Router = new Router<DefaultState, Context>(routerOpts);
userRouter.get('/', async (ctx: RContext) => {
    const oauthGrant = ctx.session.grant;
    // TODO Probably have to handle case of this access token being expired
    const getUser = await DiscordApi.getUser(oauthGrant.response.access_token);
    const discordUser = await getUser.json();
    ctx.ok(new FESession(discordUser))
});

export default userRouter.routes();
