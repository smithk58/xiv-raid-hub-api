import * as Router from '@koa/router';
import { DefaultState, Context, ParameterizedContext } from 'koa';

import { Session } from '../models/Session';
import { User } from '../models/User';
import { UserService } from '../services/UserService';
import { DiscordApi } from '../services/api-wrappers/discord/discord-api';
import { Container } from 'typescript-ioc';

const discordApi: DiscordApi = Container.get(DiscordApi);
const userService: UserService = Container.get(UserService);

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
        const discordUser = await discordApi.getUser(oauthGrant.response.access_token).catch(() => {});
        if (discordUser) {
            const user = await userService.login(discordUser, ctx.session.timezone);
            // Persist some basic stuff to the session
            ctx.session.user = new User(
                user.id,
                user.username,
                userService.getAvatarUrl(discordUser),
                user.timezone
            );
        }
    }
    const frontendURL = process.env.FRONTEND_BASE_URL || 'https://www.xivraidhub.com/';
    ctx.redirect(frontendURL);
});
/**
 * Made on page load and after session changes (e.g. login/logout) to give misc. session information.
 */
sessionRouter.get('/', async (ctx: RContext) => {
    ctx.session.timezone = ctx.query.timezone;
    // Figure out the abbreviated timezone (e.g. CST)
    const timezone = userService.getPrettyTimezone(ctx.query.timezone);
    const user = ctx.session.user;
    ctx.ok(new Session(user, timezone));
});
sessionRouter.get('/logout', async (ctx: RContext) => {
    ctx.session = null;
    ctx.send(204);
});
export default sessionRouter.routes();
