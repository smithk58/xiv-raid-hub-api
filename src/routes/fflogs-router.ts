import * as Router from '@koa/router';
import { Context, DefaultState } from 'koa';
import { Container } from 'typescript-ioc';

import { RContext } from './character-router';
import { FFLogsAPI } from '../services/api-wrappers/fflogs/fflogs-api';

const ffLogsApi: FFLogsAPI = Container.get(FFLogsAPI);

const routerOpts: Router.RouterOptions = {prefix: '/fflogs'};
const fflogsRouter: Router = new Router<DefaultState, Context>(routerOpts);

// Get an FFlogs public token if we don't have one yet
fflogsRouter.use(async (ctx: RContext, next) => {
    if (!ffLogsApi.publicTokenIsSet()) {
        await ffLogsApi.setPublicToken();
    }
    return next();
});
fflogsRouter.get('/classes', async (ctx: RContext) => {
    const classes = await ffLogsApi.getClasses();
    ctx.ok(classes);
});
fflogsRouter.get('/regions', async (ctx: RContext) => {
    const regions = await ffLogsApi.getRegions();
    ctx.ok(regions);
});
fflogsRouter.get('/servers', async (ctx: RContext) => {
    const servers = await ffLogsApi.getServers();
    ctx.ok(servers);
});
export default fflogsRouter.routes();
