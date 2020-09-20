import { DiscordUser } from './DiscordUser';

const fetch = require('node-fetch');

export abstract class DiscordApi {
    private static baseURL = 'https://discord.com/api/v6';
    public static async getUser(token: string): Promise<DiscordUser> {
        const url = this.baseURL + '/users/@me';
        const response = await fetch(url, {
            headers: {Authorization: 'Bearer ' + token}
        });
        if (response.status !== 200) {
            return Promise.reject(response);
        }
        return response.json();
    }
}
