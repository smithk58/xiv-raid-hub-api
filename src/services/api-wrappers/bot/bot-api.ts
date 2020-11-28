import { Inject, Singleton } from 'typescript-ioc';
import fetch, { Response } from 'node-fetch';
import { URL } from 'url';
import { IdNamePair } from './IdNamePair';
import { SimpleGuild } from './SimpleGuild';
import { EnvService } from '../../EnvService';

@Singleton
export class BotApi {
    @Inject private envService: EnvService;
    public async getGuilds(): Promise<Record<string, SimpleGuild>> {
        const url = this.createUrl('/guilds');
        const response = await fetch(url);
        return this.handleResponse(response);
    }
    public async getGuildChannels(guildId: string): Promise<IdNamePair[]> {
        const url = this.createUrl('/guilds/' + guildId + '/channels');
        const response = await fetch(url);
        return this.handleResponse(response);
    }
    public async getGuildRoles(guildId: string): Promise<IdNamePair[]> {
        const url = this.createUrl('/guilds/' + guildId + '/roles');
        const response = await fetch(url);
        return this.handleResponse(response);
    }
    public async getGuildDetail(guildId: string): Promise<SimpleGuild> {
        const url = this.createUrl('/guilds/' + guildId);
        const response = await fetch(url);
        return this.handleResponse(response);
    }
    private async handleResponse(response: Response) {
        if (response.status !== 200) {
            return Promise.reject(response);
        }
        return response.json();
    }
    /**
     * Creates a URL using the provided relative path with the xiv-apis base URL and API key taken care of.
     * @param path - A relative resource path to hit.
     * @param queryParams - Extra query params to add to the request.
     */
    private createUrl(path: string, queryParams?: Record<string, string>): URL {
        const baseUrl = this.envService.botBaseURL;
        const url = new URL(baseUrl + '/api' + path);
        // Append query params
        const params = queryParams ? queryParams : {};
        params.api_key = this.envService.botAPIKey;
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
        return url;
    }
}
