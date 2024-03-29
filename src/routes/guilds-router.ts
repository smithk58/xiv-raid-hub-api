/* eslint-disable */
import { Context, DefaultState, ParameterizedContext } from 'koa';
import * as Router from '@koa/router';
import { Container } from 'typescript-ioc';

import { UserService } from '../services/UserService';
import { AlarmService } from '../services/AlarmService';
import { DiscordApi } from '../services/api-wrappers/discord/discord-api';

export type RContext = ParameterizedContext<DefaultState, Context & Router.RouterParamContext<DefaultState, Context>>;

const routerOpts: Router.RouterOptions = {prefix: '/guilds'};
const raidGroupRouter: Router = new Router<DefaultState, Context>(routerOpts);

const discordApi: DiscordApi = Container.get(DiscordApi);
const userService: UserService = Container.get(UserService);

// Protect these routes
raidGroupRouter.use(async (ctx: RContext, next) => {
    userService.errorIfNotAuthed(ctx);
    return next();
});
raidGroupRouter.get('/', async (ctx: RContext) => {
    const oauthGrant = ctx.session.discordGrant;
    const targetGuild = ctx.query.targetGuildId as string;
    const guilds = await discordApi.getGuilds(oauthGrant.response.access_token, targetGuild);
    ctx.ok(guilds);
});
raidGroupRouter.get('/:id/channels', async (ctx: RContext) => {
    const oauthGrant = ctx.session.discordGrant;
    const guildId = ctx.params.id;
    const channels = await discordApi.getGuildChannels(guildId, oauthGrant.response.access_token).catch((err) => {
        ctx.internalServerError('Unable to get channels for the selected server.');
        ctx.res.end();
    });
    if (channels) {
        ctx.ok(channels);
    } else {
        ctx.notFound('That server either doesn\'t exist, or you don\'t have Manage Guild permission to it.');
    }
});
raidGroupRouter.get('/:id/roles', async (ctx: RContext) => {
    const oauthGrant = ctx.session.discordGrant;
    const guildId = ctx.params.id;
    const channels = await discordApi.getGuildRoles(guildId, oauthGrant.response.access_token).catch((err) => {
        ctx.internalServerError('Unable to get roles for the selected server.');
        ctx.res.end();
    });
    if (channels) {
        ctx.ok(channels);
    } else {
        ctx.notFound('That server doesn\'t exist.');
    }
});
export default raidGroupRouter.routes();
