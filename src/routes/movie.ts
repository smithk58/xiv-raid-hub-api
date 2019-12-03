import * as Koa from 'koa';
import * as Router from '@koa/router';

const routerOpts: Router.RouterOptions = {prefix: '/movies',};
const movieRouter: Router = new Router(routerOpts);
movieRouter.get('/', async (ctx: Koa.Context) => {
    ctx.body = 'GET ALL';
});
movieRouter.get('/:movie_id', async (ctx: Koa.Context) => {
    ctx.body = 'GET SINGLE ' + process.env.PORT;
});
movieRouter.post('/', async (ctx: Koa.Context) => {
    ctx.body = 'POST';
});
movieRouter.delete('/:movie_id', async (ctx: Koa.Context) => {
    ctx.body = 'DELETE';
});
movieRouter.patch('/:movie_id', async (ctx: Koa.Context) => {
    ctx.body = 'PATCH';
});
export default movieRouter.routes();
