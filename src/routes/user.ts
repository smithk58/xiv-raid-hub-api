import * as Router from '@koa/router';
import { DefaultState, Context, ParameterizedContext } from 'koa';

// Needed for context type shenanigans
export type RContext = ParameterizedContext<DefaultState, Context & Router.RouterParamContext<DefaultState, Context>>;

const routerOpts: Router.RouterOptions = {prefix: '/user'};
const sessionRouter: Router = new Router<DefaultState, Context>(routerOpts);
sessionRouter.get('/', async (ctx: RContext) => {

});
export default sessionRouter.routes();
