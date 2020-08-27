import * as Router from '@koa/router';

import UserRouter from './user';
import SessionRouter from './session';

const apiRouter = new Router({prefix: '/api'});
apiRouter.use(SessionRouter);
apiRouter.use(UserRouter);
export default apiRouter;
