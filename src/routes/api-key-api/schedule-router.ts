import { RContext } from '../raid-group-router';
import * as Router from '@koa/router';
import { Context, DefaultState } from 'koa';
import { APIKeyService } from '../../services/APIKeyService';

const apiKeyService = new APIKeyService();

const routerOpts: Router.RouterOptions = {};
const raidGroupRouter: Router = new Router<DefaultState, Context>(routerOpts);
// Protect these routes
raidGroupRouter.use(async (ctx: RContext, next) => {
    await apiKeyService.errorIfNotValidAPIKey(ctx);
    return next();
});
