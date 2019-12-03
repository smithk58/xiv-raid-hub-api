import * as Router from '@koa/router';

import MovieRouter from './movie';

const apiRouter = new Router({prefix: '/api'});
apiRouter.use(MovieRouter);

export default apiRouter;
