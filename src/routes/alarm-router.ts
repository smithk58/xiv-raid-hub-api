/* eslint-disable */
import * as Router from '@koa/router';
import { Context, DefaultState } from 'koa';
import { Container } from 'typescript-ioc';
import { plainToClass } from 'class-transformer';

import { RContext } from './character-router';
import { UserService } from '../services/UserService';
import { AlarmService } from '../services/AlarmService';
import { AlarmDefinition } from '../repository/entity/AlarmDefinition';

const routerOpts: Router.RouterOptions = {prefix: '/alarms'};
const alarmRouter: Router = new Router<DefaultState, Context>(routerOpts);

const userService: UserService = Container.get(UserService);
const alarmService: AlarmService = Container.get(AlarmService);

// Protect these routes
alarmRouter.use(async (ctx: RContext, next) => {
    userService.errorIfNotAuthed(ctx);
    return next();
});

alarmRouter.get('/', async (ctx: RContext) => {
    const alarms = await alarmService.getAlarmDefinitions(ctx.session.user.id);
    ctx.ok(alarms);
});
alarmRouter.post('/', async (ctx: RContext) => {
    const alarm: AlarmDefinition = plainToClass(AlarmDefinition, ctx.request.body);
    const token = ctx.session.discordGrant.response.access_token;
    const res = await alarmService.createAlarmDefinition(alarm, ctx.session.user.id, ctx.session.user.discordId, token);
    if (res) {
        ctx.ok(res);
    } else {
        ctx.notFound('That raid group no longer exists, or you don\'t have permission to add an alarm for it.');
    }
});
alarmRouter.put('/:id', async (ctx: RContext) => {
    const alarm: AlarmDefinition = plainToClass(AlarmDefinition, ctx.request.body);
    alarm.id = parseInt(ctx.params.id, 10);
    const token = ctx.session.discordGrant.response.access_token;
    const res = await alarmService.updateAlarmDefinition(alarm, ctx.session.user.id, ctx.session.user.discordId, token);
    if (res) {
        ctx.ok(res);
    } else {
        ctx.notFound('That alarm or raid group no longer exist, or you don\'t have permission to use one of them.');
    }
});
alarmRouter.delete('/:id', async (ctx: RContext) => {
    const alarmId = parseInt(ctx.params.id, 10);
    const res = await alarmService.deleteAlarmDefinition(ctx.session.user.id, alarmId);
    if (res) {
        ctx.ok(res);
    } else {
        ctx.notFound('That alarm no longer exists, or you don\'t have permission to delete it.');
    }
});
export default alarmRouter.routes();
