/* eslint-disable */
import { Context, DefaultState, ParameterizedContext } from 'koa';
import * as Router from '@koa/router';
import { plainToClass } from 'class-transformer';
import { Container } from 'typescript-ioc';

import { WeeklyRaidTime } from '../repository/entity/WeeklyRaidTime';
import { RaidGroup } from '../repository/entity/RaidGroup';
import { UserService } from '../services/UserService';
import { RaidGroupService } from '../services/RaidGroupService';
import { RaidTimeService } from '../services/RaidTimeService';
import { AlarmService } from '../services/AlarmService';

const raidGroupService: RaidGroupService = Container.get(RaidGroupService);
const raidTimeService: RaidTimeService = Container.get(RaidTimeService);
const alarmsService: AlarmService = Container.get(AlarmService);
const userService: UserService = Container.get(UserService);

export type RContext = ParameterizedContext<DefaultState, Context & Router.RouterParamContext<DefaultState, Context>>;

const routerOpts: Router.RouterOptions = {prefix: '/raid-groups'};
const raidGroupRouter: Router = new Router<DefaultState, Context>(routerOpts);
// Protect these routes
raidGroupRouter.use(async (ctx: RContext, next) => {
    userService.errorIfNotAuthed(ctx);
    return next();
});

raidGroupRouter.get('/', async (ctx: RContext) => {
    const raidGroups = await raidGroupService.getRaidGroups(ctx.session.user.id);
    ctx.ok(raidGroups);
});
raidGroupRouter.post('/', async (ctx: RContext) => {
    const raidGroup = plainToClass(RaidGroup, ctx.request.body);
    const res = await raidGroupService.createRaidGroup(ctx.session.user.id, raidGroup);
    ctx.ok(res);
});
raidGroupRouter.get('/:id', async (ctx: RContext) => {
    const raidGroupId = parseInt(ctx.params.id, 10);
    const raidGroup = await raidGroupService.getRaidGroupWithCharacters(ctx.session.user.id, raidGroupId);
    if (raidGroup) {
        ctx.ok(raidGroup);
    } else {
        ctx.notFound('That raid group no longer exists, or you don\'t have permission to see it.');
    }

});
raidGroupRouter.post('/:id', async (ctx: RContext) => {
    const raidGroupId = parseInt(ctx.params.id, 10);
    const raidGroup = await raidGroupService.copyRaidGroup(ctx.session.user.id, raidGroupId);
    if (raidGroup) {
        ctx.ok(raidGroup);
    } else {
        ctx.notFound('That raid group no longer exists, or you don\'t have permission to copy it.');
    }
});
raidGroupRouter.put('/:id', async (ctx: RContext) => {
    const raidGroup = plainToClass(RaidGroup, ctx.request.body);
    raidGroup.id = parseInt(ctx.params.id, 10);
    const res = await raidGroupService.updateRaidGroup(ctx.session.user.id, raidGroup);
    if (res) {
        ctx.ok(res);
    } else {
        ctx.notFound('That raid group no longer exists, or you don\'t have permission to update it.');
    }
});
raidGroupRouter.delete('/:id', async (ctx: RContext) => {
    const raidGroupId = parseInt(ctx.params.id, 10);
    // Attempt to delete the group
    const deleteGroupRes = await raidGroupService.deleteRaidGroup(ctx.session.user.id, raidGroupId);
    const deleteGroupSuccess = deleteGroupRes && deleteGroupRes.affected > 0;
    // Attempt to remove current users characters from the group instead if they didn't appear to have permission to delete the group
    let deleteCharactersSuccess = false;
    if (!deleteGroupRes) {
        const res = await raidGroupService.deleteRaidGroupCharactersForUser(ctx.session.user.id, raidGroupId);
        deleteCharactersSuccess = res && res.length > 0;
    }

    if (deleteGroupSuccess || deleteCharactersSuccess) {
        ctx.send(204);
    } else {
        ctx.notFound('That raid group no longer exists, or you don\'t have permission to delete it.');
    }
});
raidGroupRouter.get('/:id/raid-times', async (ctx: RContext) => {
    const raidGroupId = parseInt(ctx.params.id, 10);
    const res = await alarmsService.getWeeklyRaidTimes(ctx.session.user.id, raidGroupId);
    if (res) {
        ctx.ok(res);
    } else {
        ctx.notFound('That raid group no longer exists, or you don\'t have permission to see its schedule.');
    }
});
raidGroupRouter.put('/:id/raid-times', async (ctx: RContext) => {
    const raidGroupId = parseInt(ctx.params.id, 10);
    const raidTimes: WeeklyRaidTime[] = plainToClass<WeeklyRaidTime, WeeklyRaidTime>(WeeklyRaidTime, ctx.request.body);
    const res = await raidTimeService.updateWeeklyRaidTimes(ctx.session.user.id, raidGroupId, raidTimes);
    if (res) {
        ctx.ok(res);
    } else {
        ctx.notFound('That raid group no longer exists, or you don\'t have permission to see its schedule.');
    }
});
export default raidGroupRouter.routes();
