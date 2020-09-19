// Needed for context type shenanigans
import { Context, DefaultState, ParameterizedContext } from "koa";
import * as Router from "@koa/router";

import { WeeklyRaidTime } from "../repository/entity/WeeklyRaidTime";
import RaidGroupService from "../services/RaidGroupService";
import UserService from "../services/UserService";
import { plainToClass } from "class-transformer";
import { RaidGroup } from "../repository/entity/RaidGroup";

export type RContext = ParameterizedContext<DefaultState, Context & Router.RouterParamContext<DefaultState, Context>>;

const routerOpts: Router.RouterOptions = {};
const raidGroupRouter: Router = new Router<DefaultState, Context>(routerOpts);
// Protect these routes
raidGroupRouter.use(async (ctx: RContext, next) => {
    UserService.errorIfNotAuthed(ctx);
    return next();
});

raidGroupRouter.get('/raid-groups', async (ctx: RContext) => {
    const raidGroups = await RaidGroupService.getRaidGroups(ctx.session.user.id);
    ctx.ok(raidGroups);
});
raidGroupRouter.post('/raid-groups', async (ctx: RContext) => {
    const raidGroup = plainToClass(RaidGroup, ctx.request.body);
    const res = await RaidGroupService.createRaidGroup(ctx.session.user.id, raidGroup);
    ctx.ok(res);
});
raidGroupRouter.get('/raid-groups/:id', async (ctx: RContext) => {
    const raidGroupId = parseInt(ctx.params.id, 10);
    const raidGroup = await RaidGroupService.getRaidGroupWithCharacters(ctx.session.user.id, raidGroupId);
    if (raidGroup) {
        ctx.ok(raidGroup);
    } else {
        ctx.notFound('That raid group no longer exists, or you don\'t have permission to see it.');
    }

});
raidGroupRouter.put('/raid-groups/:id', async (ctx: RContext) => {
    const raidGroup = plainToClass(RaidGroup, ctx.request.body);
    raidGroup.id = parseInt(ctx.params.id, 10);
    const res = await RaidGroupService.updateRaidGroup(ctx.session.user.id, raidGroup);
    if (res) {
        ctx.ok(res);
    } else {
        ctx.notFound('That raid group no longer exists, or you don\'t have permission to update it.');
    }
});
raidGroupRouter.delete('/raid-groups/:id', async (ctx: RContext) => {
    const raidGroupId = parseInt(ctx.params.id, 10);
    // Attempt to delete the group
    const deleteGroupRes = await RaidGroupService.deleteRaidGroup(ctx.session.user.id, raidGroupId);
    const deleteGroupSuccess = deleteGroupRes && deleteGroupRes.affected > 0;
    // Attempt to remove current users characters from the group instead if they didn't appear to have permission to delete the group
    let deleteCharactersSuccess = false;
    if(!deleteGroupRes) {
        const res = await RaidGroupService.deleteRaidGroupCharactersForUser(ctx.session.user.id, raidGroupId);
        deleteCharactersSuccess = res && res.length > 0;
    }

    if (deleteGroupSuccess || deleteCharactersSuccess) {
        ctx.send(204);
    } else {
        ctx.notFound('That raid group no longer exists, or you don\'t have permission to delete it.');
    }
});
raidGroupRouter.get('/raid-groups/:id/raidTimes', async (ctx: RContext) => {
    const raidGroupId = parseInt(ctx.params.id, 10);
    const res = await RaidGroupService.getWeeklyRaidTimes(ctx.session.user.id, raidGroupId);
    if (res) {
        ctx.ok(res);
    } else {
        ctx.notFound('That raid group no longer exists, or you don\'t have permission to see its schedule.');
    }
});
raidGroupRouter.put('/raid-groups/:id/raidTimes', async (ctx: RContext) => {
    const raidGroupId = parseInt(ctx.params.id, 10);
    const raidTimes: WeeklyRaidTime[] = plainToClass<WeeklyRaidTime, WeeklyRaidTime>(WeeklyRaidTime, ctx.request.body);
    const res = await RaidGroupService.updateWeeklyRaidTimes(ctx.session.user.id, raidGroupId, raidTimes);
    if (res) {
        ctx.ok(res);
    } else {
        ctx.notFound('That raid group no longer exists, or you don\'t have permission to see its schedule.');
    }
});
raidGroupRouter.get('/raidTimes', async (ctx: RContext) => {
    const res = await RaidGroupService.getAllWeeklyRaidTimes(ctx.session.user.id);
    if (res) {
        ctx.ok(res);
    } else {
        ctx.notFound('That raid group no longer exists, or you don\'t have permission to see its schedule.');
    }
});
export default raidGroupRouter.routes();
