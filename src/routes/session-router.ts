import * as Router from '@koa/router';
import { DefaultState, Context, ParameterizedContext } from 'koa';

import { DiscordApi } from "../services/api-wrappers/discord-api";

import { Session } from "../models/Session";
import UserService from "../services/UserService";
import { User } from "../models/User";

// Needed for context type shenanigans
export type RContext = ParameterizedContext<DefaultState, Context & Router.RouterParamContext<DefaultState, Context>>;

const routerOpts: Router.RouterOptions = {prefix: '/session'};
const sessionRouter: Router = new Router<DefaultState, Context>(routerOpts);
/**
 * Grant redirects here after a user has authed via discord. Should confirm the user is who they say they are, update
 * our local user, etc..
 */
sessionRouter.get('/login', async (ctx: RContext) => {
    // Attempt to resolve the discord user if we have an access token
    const oauthGrant = ctx.session.grant;
    if (oauthGrant) {
        const discordUser = await DiscordApi.getUser(oauthGrant.response.access_token).catch(() => {});
        delete ctx.session.grant; // don't want the grant to persist in the session for now
        if (discordUser) {
            const user = await UserService.login(discordUser);
            // Persist some basic stuff to the session
            ctx.session.user = new User(
                user.id,
                user.username,
                UserService.getAvatarUrl(discordUser)
            );
        }
    }
    ctx.redirect(process.env.FRONTEND_BASE_URL ? process.env.FRONTEND_BASE_URL : process.env.BACKEND_BASE_URL);
});
sessionRouter.get('/', async (ctx: RContext) => {
    // Figure out the abbreviated timezone (e.g. CST)
    const timezone = UserService.getPrettyTimezone(ctx.query.timezone);
    const user = ctx.session.user;
    ctx.ok(new Session(user, timezone))
});
sessionRouter.get('/logout', async (ctx: RContext) => {
    ctx.session = null;
    ctx.send(204);
});
export default sessionRouter.routes();
