import { Context, DefaultState, ParameterizedContext } from "koa";
import * as Router from "@koa/router";
import UserService from "../services/UserService";
import RaidGroupService from "../services/RaidGroupService";

export type RContext = ParameterizedContext<DefaultState, Context & Router.RouterParamContext<DefaultState, Context>>;

const routerOpts: Router.RouterOptions = {prefix: '/user'};
const userRouter: Router = new Router<DefaultState, Context>(routerOpts);
// Protect these routes
userRouter.use(async (ctx: RContext, next) => {
    UserService.errorIfNotAuthed(ctx);
    return next();
});
userRouter.get('/claim/:id', async (ctx: RContext) => {
    const characterId = parseInt(ctx.params.id, 10);
    // TODO https://nodejs.dev/learn/making-http-requests-with-nodejs
    const raidGroups = await RaidGroupService.getRaidGroups(ctx.session.user.id);
    ctx.ok(raidGroups);
});
export default userRouter.routes();
