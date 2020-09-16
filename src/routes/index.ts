import * as Router from '@koa/router';

import SessionRouter from './session-router';
import RaidGroupRouter from './raid-group-router';
import CharacterRouter from './character-router';

const apiRouter = new Router({prefix: '/api'});
apiRouter.use(SessionRouter);
apiRouter.use(RaidGroupRouter);
apiRouter.use(CharacterRouter);
export default apiRouter;
