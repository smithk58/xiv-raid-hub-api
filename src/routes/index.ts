import * as Router from '@koa/router';

import UserRouter from './user';

const apiRouter = new Router({prefix: '/api'});
apiRouter.use(UserRouter);
export default apiRouter;
