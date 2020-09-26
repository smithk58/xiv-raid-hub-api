import { DiscordUser } from './DiscordUser';
import { Singleton } from 'typescript-ioc';
import fetch from 'node-fetch';

@Singleton
export class DiscordApi {
    private static baseURL = 'https://discord.com/api/v6';
    public async getUser(token: string): Promise<DiscordUser> {
        const url = DiscordApi.baseURL + '/users/@me';
        const response = await fetch(url, {
            headers: {Authorization: 'Bearer ' + token}
        });
        if (response.status !== 200) {
            return Promise.reject(response);
        }
        return response.json();
    }
}
