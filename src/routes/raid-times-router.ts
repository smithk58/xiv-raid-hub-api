/* eslint-disable */
import { Context, DefaultState, ParameterizedContext } from 'koa';
import * as Router from '@koa/router';

import { UserService } from '../services/UserService';
import { Container } from 'typescript-ioc';
import { RaidTimeService } from '../services/RaidTimeService';

const raidTimeService: RaidTimeService = Container.get(RaidTimeService);
const userService: UserService = Container.get(UserService);

export type RContext = ParameterizedContext<DefaultState, Context & Router.RouterParamContext<DefaultState, Context>>;
const routerOpts: Router.RouterOptions = {prefix: '/raid-times'};
const raidTimesRouter: Router = new Router<DefaultState, Context>(routerOpts);
// Protect these routes
raidTimesRouter.use(async (ctx: RContext, next) => {
    userService.errorIfNotAuthed(ctx);
    return next();
});
raidTimesRouter.get('/', async (ctx: RContext) => {
    const res = await raidTimeService.getAllWeeklyRaidTimes(ctx.session.user.id);
    ctx.ok(res);
});
export default raidTimesRouter.routes();
