// Needed for context type shenanigans
import { Context, DefaultState, ParameterizedContext } from "koa";
import * as Router from "@koa/router";

import moment = require("moment-timezone");

import { RaidGroup } from "../models/RaidGroup";
import { WeeklyRaidTime } from "../models/WeeklyRaidTime";

export type RContext = ParameterizedContext<DefaultState, Context & Router.RouterParamContext<DefaultState, Context>>;

const routerOpts: Router.RouterOptions = {};
const raidGroupRouter: Router = new Router<DefaultState, Context>(routerOpts);
raidGroupRouter.get('/raid-groups', async (ctx: RContext) => {
    // 2020-11-05T02:30:00.000Z  - 8:30pm cst (20:30:00 GMT-0600) = + 6 hrs is utc zero
    const raidGroup: RaidGroup[] = [
        {
            "id": "44dcbdc1-15dd-4145-9191-f43d5bf10ef1",
            "name": "Wipe Squad longer name blah blah",
            "purpose": "UCOB",
            "hasSchedule": true
        },
        {
            "id": "7ca1c608-a06d-4cf8-bf0d-a8aa09c5c9d6",
            "name": "Wipe Squad",
            "hasSchedule": true
        }
    ];
    /*{
        id: '1',
        name: 'Wipe Squad',
        purpose: 'UCOB',
        weeklyRaidTimes: [
            {weekMask: '', isoTime: ''}
        ]
    }*/
    // 2020-09-05T03:59:00.811Z
    //  America/Chicago
    // America/Los_Angeles
    // 8:20pm my time
    const m1 = moment('2020-09-05T02:03:36.422Z', moment.ISO_8601).tz('America/Chicago');
    const m2 = moment('2020-09-05T02:03:36.422Z', moment.ISO_8601).tz('America/Los_Angeles');
    const m3 = moment().tz('America/Los_Angeles');
    m3.set('hour', 18);
    m3.set('minute', 0);
    m3.set('second', 0);
    console.log('m1', m1.format('YYYY-MM-DDTHH:mm:ss.sssZ'));
    console.log('m2', m2.format('ddd DD-MMM-YYYY, hh:mm A'));
    console.log('m3', m3.format('ddd DD-MMM-YYYY, hh:mm A'));
    ctx.send(200, raidGroup);
});
raidGroupRouter.get('/raid-groups/:id', async (ctx: RContext) => {
    // TODO return particular raid group
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
    ctx.send(200, raidTimes.filter(x => x.raidGroupId === raidGroupId));
});
raidGroupRouter.put('/raid-groups/:id/schedules', async (ctx: RContext) => {
    const raidGroupId = ctx.params.id;
    const weeklyRaidTimes = ctx.request.body;
    // TODO https://www.npmjs.com/package/class-transformer-validator
    ctx.send(200, weeklyRaidTimes);
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
    ctx.send(200, raidTimes);
});
export default raidGroupRouter.routes();
