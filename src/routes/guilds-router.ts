import { Context, DefaultState, ParameterizedContext } from 'koa';
import * as Router from '@koa/router';
import { Container } from 'typescript-ioc';

import { UserService } from '../services/UserService';
import { DiscordApi } from '../services/api-wrappers/discord/discord-api';
import { BotApi } from '../services/api-wrappers/bot-api';
import { DiscordGuild } from '../services/api-wrappers/discord/DiscordGuild';

const discordApi: DiscordApi = Container.get(DiscordApi);
const userService: UserService = Container.get(UserService);

export type RContext = ParameterizedContext<DefaultState, Context & Router.RouterParamContext<DefaultState, Context>>;

const routerOpts: Router.RouterOptions = {prefix: '/guilds'};
const raidGroupRouter: Router = new Router<DefaultState, Context>(routerOpts);

const botApi: BotApi = Container.get(BotApi);

// Protect these routes
raidGroupRouter.use(async (ctx: RContext, next) => {
    userService.errorIfNotAuthed(ctx);
    return next();
});
raidGroupRouter.get('/', async (ctx: RContext) => {
    const oauthGrant = ctx.session.grant;
    const usersGuilds = await discordApi.getGuilds(oauthGrant.response.access_token);
    const botsGuildMap = await botApi.getGuilds().catch((err) => {
        ctx.internalServerError('Unable to get the list of guilds available to the bot. ' + err);
        ctx.res.end();
    }) as Record<string, DiscordGuild>;
    // Filter to users guilds that the bot is available on
    const guilds = usersGuilds.filter((guild) => typeof(botsGuildMap[guild.id]) !== 'undefined');
    ctx.ok(guilds);
});
raidGroupRouter.get('/:id/channels', async (ctx: RContext) => {
    const guildId = ctx.params.id;
    const channels = await botApi.getGuildChannels(guildId).catch((err) => {
        ctx.internalServerError('Unable to get channels for the selected server.');
        ctx.res.end();
    });
    ctx.ok(channels);
});
export default raidGroupRouter.routes();
