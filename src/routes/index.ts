import * as Router from '@koa/router';

import SessionRouter from './session-router';
import RaidGroupRouter from './raid-group-router';

const apiRouter = new Router({prefix: '/api'});
apiRouter.use(SessionRouter);
apiRouter.use(RaidGroupRouter);
export default apiRouter;
