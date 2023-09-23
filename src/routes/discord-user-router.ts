/* eslint-disable */
import { RContext } from './raid-group-router';
import * as Router from '@koa/router';
import { Context, DefaultState } from 'koa';

import { APIKeyService } from '../services/APIKeyService';
import { DiscordUserService } from '../services/DiscordUserService';
import { Container } from 'typescript-ioc';

const apiKeyService: APIKeyService = Container.get(APIKeyService);
const discordUserService: DiscordUserService = Container.get(DiscordUserService);

const routerOpts: Router.RouterOptions = {prefix: '/discord-user/:discordUserId'};
const discordUserRouter: Router = new Router<DefaultState, Context>(routerOpts);
// Protect these routes
discordUserRouter.use(async (ctx: RContext, next) => {
    await apiKeyService.errorIfNotValidAPIKey(ctx);
    return next();
});
discordUserRouter.get('/characters', async (ctx: RContext) => {
    const userId = ctx.params.discordUserId;
    const characters = await discordUserService.getDiscordUserCharacters(userId);
    if (characters) {
        ctx.ok(characters);
    } else {
        ctx.notFound('That user doesn\'t exist, or you don\'t have permission to see their information.');
    }
});
discordUserRouter.get('/schedule', async (ctx: RContext) => {
    const userId = ctx.params.discordUserId;
    const raidTimes = await discordUserService.getDiscordUsersWeeklyRaidTimes(userId);
    if (raidTimes) {
        ctx.ok(raidTimes);
    } else {
        ctx.notFound('That user doesn\'t exist, or you don\'t have permission to see their raid times.');
    }
});
export default discordUserRouter.routes();
