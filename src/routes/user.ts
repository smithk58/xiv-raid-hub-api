import * as Router from '@koa/router';
import { DefaultState, Context, ParameterizedContext } from 'koa';
import { DiscordApi } from "../api-wrappers/discord-api";

import { FESession } from "../models/FESession";
import { APIUser } from "discord-api-types/default";

// Needed for context type shenanigans
export type RContext = ParameterizedContext<DefaultState, Context & Router.RouterParamContext<DefaultState, Context>>;

const routerOpts: Router.RouterOptions = {prefix: '/user'};
const userRouter: Router = new Router<DefaultState, Context>(routerOpts);
userRouter.get('/', async (ctx: RContext) => {
    let user: APIUser;
    // Attempt to resolve the discord user if we have an access token
    const oauthGrant = ctx.session.grant;
    if (oauthGrant) {
        const getUser = await DiscordApi.getUser(oauthGrant.response.access_token);
        if (getUser.ok) {
            user = await getUser.json();
        }
        // TODO Instead of making them click login again can probably refresh token if it was a 401
    }
    ctx.ok(new FESession(user))
});

export default userRouter.routes();
