import * as Router from '@koa/router';
import { Context, DefaultState } from 'koa';
import { Container } from 'typescript-ioc';

import { RContext } from './character-router';
import { AlarmService } from '../services/AlarmService';
import { APIKeyService } from '../services/APIKeyService';

const apiKeyService: APIKeyService = Container.get(APIKeyService);
const alarmService: AlarmService = Container.get(AlarmService);

const routerOpts: Router.RouterOptions = {prefix: '/bot'};
const botRouter: Router = new Router<DefaultState, Context>(routerOpts);

// Protect these routes
botRouter.use(async (ctx: RContext, next) => {
    await apiKeyService.errorIfNotValidAPIKey(ctx);
    return next();
});

botRouter.get('/scheduled-alarms', async (ctx: RContext) => {
    const utcHour = parseInt(ctx.query.utcHour, 10);
    const utcMinute = parseInt(ctx.query.utcMinute, 10);
    const alarms = await alarmService.getScheduledAlarms(utcHour, utcMinute);
    ctx.ok(alarms);
});
export default botRouter.routes();
