import { Context, DefaultState, ParameterizedContext } from 'koa';
import * as Router from '@koa/router';
import { Container } from 'typescript-ioc';

import { UserService } from '../services/UserService';
import { AlarmService } from '../services/AlarmService';

export type RContext = ParameterizedContext<DefaultState, Context & Router.RouterParamContext<DefaultState, Context>>;

const routerOpts: Router.RouterOptions = {prefix: '/guilds'};
const raidGroupRouter: Router = new Router<DefaultState, Context>(routerOpts);

const alarmService: AlarmService = Container.get(AlarmService);
const userService: UserService = Container.get(UserService);

// Protect these routes
raidGroupRouter.use(async (ctx: RContext, next) => {
    userService.errorIfNotAuthed(ctx);
    return next();
});
raidGroupRouter.get('/', async (ctx: RContext) => {
    const oauthGrant = ctx.session.grant;
    const targetGuild = ctx.query.targetGuildId;
    const guilds = await alarmService.getGuilds(oauthGrant.response.access_token, targetGuild);
    ctx.ok(guilds);
});
raidGroupRouter.get('/:id/channels', async (ctx: RContext) => {
    const oauthGrant = ctx.session.grant;
    const guildId = ctx.params.id;
    const channels = await alarmService.getGuildChannels(guildId, oauthGrant.response.access_token).catch((err) => {
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
    const oauthGrant = ctx.session.grant;
    const guildId = ctx.params.id;
    const channels = await alarmService.getGuildRoles(guildId, oauthGrant.response.access_token).catch((err) => {
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
