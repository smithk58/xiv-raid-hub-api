import { Singleton } from 'typescript-ioc';
import fetch, { Response } from 'node-fetch';

import { DiscordUser } from './DiscordUser';
import { DiscordGuild } from './DiscordGuild';
import { IdNamePair } from '../bot/IdNamePair';

export type DiscordGuildWithChannels = DiscordGuild & {channels?: IdNamePair[]};

@Singleton
export class DiscordApi {
    private static baseURL = 'https://discord.com/api/v6';
    public async getUser(token: string): Promise<DiscordUser> {
        const url = DiscordApi.baseURL + '/users/@me';
        const response = await fetch(url, {
            headers: {Authorization: 'Bearer ' + token}
        });
        return this.handleResponse(response);
    }
    public async getGuilds(token: string): Promise<DiscordGuildWithChannels[]> {
        const url = DiscordApi.baseURL + '/users/@me/guilds';
        const response = await fetch(url, {
            headers: {Authorization: 'Bearer ' + token}
        });
        return this.handleResponse(response);
    }
    private async handleResponse(response: Response) {
        if (response.status !== 200) {
            return Promise.reject(response);
        }
        return response.json();
    }
}
