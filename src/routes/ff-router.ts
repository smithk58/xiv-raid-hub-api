/* eslint-disable */
import * as Router from '@koa/router';
import { Context, DefaultState } from 'koa';

import { RContext } from './character-router';
import { XIVClasses } from '../constants';

const routerOpts: Router.RouterOptions = {prefix: '/ff'};
const ffRouter: Router = new Router<DefaultState, Context>(routerOpts);

ffRouter.get('/classes', async (ctx: RContext) => {
    ctx.ok(XIVClasses);
});
export default ffRouter.routes();
