import {Response} from "node-fetch";

const fetch = require('node-fetch');

export abstract class DiscordApi {
    private static baseURL = 'https://discord.com/api/v6';
    public static async getUser(token: string): Promise<Response> {
        const url = this.baseURL + '/users/@me';
        return fetch(url, {
            headers: {'Authorization': 'Bearer ' + token}
        });
    }
}
