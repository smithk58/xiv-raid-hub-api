import { Singleton } from 'typescript-ioc';
import fetch, { Response } from 'node-fetch';
import { URL } from 'url';

@Singleton
export class BotApi {
    public async getGuilds() {
        const url = this.createUrl('/guilds');
        const response = await fetch(url);
        return this.handleResponse(response);
    }
    public async getGuildChannels(guildId: string): Promise<any[]> {
        const url = this.createUrl('/guilds/' + guildId + '/channels');
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
        const baseUrl = process.env.BOT_BASE_URL || 'https://bot.xivraidhub.com';
        const url = new URL(baseUrl + '/api' + path);
        // Append query params
        const params = queryParams ? queryParams : {};
        params.api_key = process.env.XIV_RAID_HUB_BOT_API_KEY;
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
        return url;
    }
}
