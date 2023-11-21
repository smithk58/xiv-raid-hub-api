/* eslint-disable */
import { RContext } from './raid-group-router';
import * as Router from '@koa/router';
import { Context, DefaultState } from 'koa';

import { APIKeyService } from '../services/APIKeyService';
import { DiscordUserService } from '../services/DiscordUserService';
import { Container } from 'typescript-ioc';
import { AlarmDefinition } from '../repository/entity/AlarmDefinition';
import { plainToClass } from 'class-transformer';

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
discordUserRouter.get('/raid-times', async (ctx: RContext) => {
    const userId = ctx.params.discordUserId;
    const schedule = await discordUserService.getDiscordUsersSchedule(userId);
    if (schedule) {
        ctx.ok(schedule);
    } else {
        ctx.notFound('That user doesn\'t exist, or you don\'t have permission to see their raid schedule.');
    }
});
discordUserRouter.put('/alarms', async (ctx: RContext) => {
    const userId = ctx.params.discordUserId;
    const channelId = ctx.query.targetGuildId as string;
    // We're only using allowing update of isEnabled for now
    const alarm: AlarmDefinition = plainToClass(AlarmDefinition, ctx.request.body);
    if (typeof(alarm) === 'undefined' || typeof(alarm.isEnabled) === 'undefined') {
        ctx.badRequest('A state wasn\'t provided for isEnabled and is required.');
    }
    const updateResult = await discordUserService.toggleDiscordUsersAlarms(userId, alarm.isEnabled, channelId);
    if (updateResult) {
        ctx.ok({amountUpdated: updateResult.affected});
    } else {
        ctx.notFound('That user doesn\'t exist, or you don\'t have permission to update their alarms.');
    }
});
export default discordUserRouter.routes();
