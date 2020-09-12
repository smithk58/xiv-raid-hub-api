// Needed for context type shenanigans
import { Context, DefaultState, ParameterizedContext } from "koa";
import * as Router from "@koa/router";

import { WeeklyRaidTime } from "../models/WeeklyRaidTime";
import { transformAndValidate } from "class-transformer-validator";
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
   await next();
});

raidGroupRouter.get('/raid-groups', async (ctx: RContext) => {
    const raidGroups = await RaidGroupService.getRaidGroups(ctx.session.user.id);
    ctx.ok(raidGroups);
});
raidGroupRouter.post('/raid-groups', async (ctx: RContext) => {
    const raidGroup = await RaidGroupService.createRaidGroup(ctx.session.user.id, ctx.request.body);
    ctx.ok(raidGroup);
});
raidGroupRouter.get('/raid-groups/:id', async (ctx: RContext) => {
    const raidGroupId = ctx.params.id;
    const raidGroup = await RaidGroupService.getRaidGroup(ctx.session.user.id, raidGroupId);
    ctx.ok(raidGroup);
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
    const res = await RaidGroupService.deleteRaidGroup(ctx.session.user.id, raidGroupId);
    if (res) {
        ctx.send(204);
    } else {
        ctx.notFound('That raid group no longer exists, or you don\'t have permission to delete it.');
    }
});
raidGroupRouter.get('/raid-groups/:id/schedules', async (ctx: RContext) => {
    const raidGroupId = ctx.params.id;
    const raidTimes: WeeklyRaidTime[] = [
        {
            "raidGroupId": "7ca1c608-a06d-4cf8-bf0d-a8aa09c5c9d6",
            "startTime": "2020-11-05T23:45:00.000Z",
            "weekMask": 38
        },
        {
            "raidGroupId": "44dcbdc1-15dd-4145-9191-f43d5bf10ef1",
            "startTime": "2020-11-05T00:30:00.000Z",
            "weekMask": 26
        },
        {
            "raidGroupId": "44dcbdc1-15dd-4145-9191-f43d5bf10ef1",
            "startTime": "2020-11-05T02:30:00.000Z",
            "weekMask": 90
        }
    ];
    ctx.ok(raidTimes.filter(x => x.raidGroupId === raidGroupId));
});
raidGroupRouter.put('/raid-groups/:id/schedules', async (ctx: RContext) => {
    const raidGroupId = ctx.params.id;
    try {
        const weeklyRaidTimes = await transformAndValidate(WeeklyRaidTime, ctx.request.body);
        // TODO Still have to validate that id matches
        // TODO DB shenanigans
    } catch(err) {
        ctx.notFound(err);
    }

    ctx.ok([]);
});
raidGroupRouter.get('/schedules', async (ctx: RContext) => {
    const raidTimes: WeeklyRaidTime[] = [
        {
            "raidGroupId": "7ca1c608-a06d-4cf8-bf0d-a8aa09c5c9d6",
            "startTime": "2020-11-05T23:45:00.000Z",
            "weekMask": 38
        },
        {
            "raidGroupId": "44dcbdc1-15dd-4145-9191-f43d5bf10ef1",
            "startTime": "2020-11-05T00:30:00.000Z",
            "weekMask": 26
        },
        {
            "raidGroupId": "44dcbdc1-15dd-4145-9191-f43d5bf10ef1",
            "startTime": "2020-11-05T02:30:00.000Z",
            "weekMask": 90
        }
    ];
    // TODO Make sure this is sorted by earliest -> latest time
    ctx.ok(raidTimes);
});
export default raidGroupRouter.routes();
