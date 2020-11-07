import * as Router from '@koa/router';
import { Context, DefaultState } from 'koa';
import { Container } from 'typescript-ioc';

import { RContext } from './character-router';
import { UserService } from '../services/UserService';

const routerOpts: Router.RouterOptions = {prefix: '/current-user'};
const currentUserRouter: Router = new Router<DefaultState, Context>(routerOpts);

const userService: UserService = Container.get(UserService);

// Protect these routes
currentUserRouter.use(async (ctx: RContext, next) => {
    userService.errorIfNotAuthed(ctx);
    return next();
});

currentUserRouter.get('/settings', async (ctx: RContext) => {
    const settings = await userService.getSettings(ctx.session.user.id);
    ctx.ok(settings);
});
currentUserRouter.put('/settings', async (ctx: RContext) => {
    const settings: Record<string, string> = ctx.request.body;
    const result = userService.updateSettings(ctx.session.user.id, settings);
    ctx.ok(result);
});

export default currentUserRouter.routes();
