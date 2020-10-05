import * as Router from '@koa/router';

import SessionRouter from './session-router';
import RaidGroupRouter from './raid-group-router';
import CharacterRouter from './character-router';
import DiscordUserRouter from './discord-user-router';
import RaidTimesRouter from './raid-times-router';
import GuildsRouter from './guilds-router';

const apiRouter = new Router({prefix: '/api'});
apiRouter.use(SessionRouter);
apiRouter.use(RaidGroupRouter);
apiRouter.use(CharacterRouter);
apiRouter.use(RaidTimesRouter);
apiRouter.use(DiscordUserRouter);
apiRouter.use(GuildsRouter);
export default apiRouter;
