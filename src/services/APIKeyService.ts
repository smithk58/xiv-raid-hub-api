import { getConnection } from 'typeorm';
import { Singleton } from 'typescript-ioc';

import { APIAccess } from '../repository/entity/APIAccess';
import { RContext } from '../routes/guilds-router';

@Singleton
export class APIKeyService {

    /**
     * Errors if the context doesn't have a valid API key.
     * @param ctx - The context to search for an API key on.
     */
    public async errorIfNotValidAPIKey(ctx: RContext) {
        const apiKey = ctx.query.api_key;
        const apiKeyMap = await this.getAPIKeyMap();
        const isValid = typeof(apiKeyMap[apiKey]) !== 'undefined';
        if (!isValid) {
            ctx.send(401);
            ctx.res.end();
        }
    }
    public async getAPIKeyMap(): Promise<Record<string, APIAccess>> {
        // TODO get these once and cache 'em
        const apiKeys = await getConnection()
            .getRepository(APIAccess)
            .createQueryBuilder()
            .getMany();
        const apiKeyMap = apiKeys.reduce((map: Record<string, APIAccess>, apiAccess) => (map[apiAccess.key] = apiAccess, map), {});
        return Promise.resolve(apiKeyMap);
    }
}
