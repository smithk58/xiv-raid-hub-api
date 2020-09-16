import { Context, DefaultState, ParameterizedContext } from "koa";
import * as Router from "@koa/router";

import UserService from "../services/UserService";
import CharacterService from "../services/CharacterService";
import { plainToClass } from "class-transformer";
import { Character } from "../repository/entity/Character";

export type RContext = ParameterizedContext<DefaultState, Context & Router.RouterParamContext<DefaultState, Context>>;

const routerOpts: Router.RouterOptions = {prefix: '/characters'};
const characterRouter: Router = new Router<DefaultState, Context>(routerOpts);
// Protect these routes
characterRouter.use(async (ctx: RContext, next) => {
    UserService.errorIfNotAuthed(ctx);
    return next();
});
characterRouter.get('/', async (ctx: RContext) => {
    const characters = await CharacterService.getUserCharacters(ctx.session.user.id);
    ctx.ok(characters);
});
characterRouter.post('/', async (ctx: RContext) => {
    const character = plainToClass(Character, ctx.request.body);
    const res = await CharacterService.createUserCharacter(ctx.session.user.id, character);
    ctx.ok(res);
});
characterRouter.put('/:id', async (ctx: RContext) => {
    const character = plainToClass(Character, ctx.request.body);
    character.id = parseInt(ctx.params.id, 10);
    const res = await CharacterService.updateUserCharacter(ctx.session.user.id, character);
    if (res) {
        ctx.ok(res);
    } else {
        ctx.notFound('That character doesn\'t exist in your characters.');
    }
});
characterRouter.delete('/:id', async (ctx: RContext) => {
    const characterId = parseInt(ctx.params.id, 10);
    const res = await CharacterService.deleteUserCharacter(ctx.session.user.id, characterId);
    if (res.affected > 0) {
        ctx.send(204);
    } else {
        ctx.notFound('That character doesn\'t exist in your characters.');
    }
});
characterRouter.get('/:id/claim', async (ctx: RContext) => {
    const characterId = parseInt(ctx.params.id, 10);
    const confirmationResult = await CharacterService.confirmCharacter(ctx.session.user.id, characterId);
    if (confirmationResult !== null) {
        ctx.ok(confirmationResult);
    } else {
        ctx.notFound('That character doesn\'t exist in your characters.');
    }
});
export default characterRouter.routes();
