import * as Router from '@koa/router';

import SessionRouter from './session-router';
import RaidGroupRouter from './raid-group-router';
import CharacterRouter from './character-router';
import DiscordUserRouter from './discord-user-router';
import RaidTimesRouter from './raid-times-router';
import GuildsRouter from './guilds-router';
import AlarmRouter from './alarm-router';
import BotRouter from './bot-router';
import CurrentUserRouter from './current-user-router';
import FFLogsRouter from './fflogs-router';

const apiRouter = new Router({prefix: '/api'});
apiRouter.use(SessionRouter);
apiRouter.use(RaidGroupRouter);
apiRouter.use(CharacterRouter);
apiRouter.use(RaidTimesRouter);
apiRouter.use(DiscordUserRouter);
apiRouter.use(GuildsRouter);
apiRouter.use(AlarmRouter);
apiRouter.use(BotRouter);
apiRouter.use(CurrentUserRouter);
apiRouter.use(FFLogsRouter);
export default apiRouter;
