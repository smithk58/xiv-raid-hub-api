import { Inject, Singleton } from 'typescript-ioc';
import fetch, { Response } from 'node-fetch';

import { DiscordUser } from './DiscordUser';
import { DiscordGuild } from './DiscordGuild';
import { IdNamePair } from '../bot/IdNamePair';
import { SimpleGuild } from '../bot/SimpleGuild';
import { BotApiService } from '../bot/BotApiService';

export type DiscordGuildWithChannels = DiscordGuild & {channels?: IdNamePair[]};

@Singleton
export class DiscordApi {
    private static baseURL = 'https://discord.com/api/v6';
    @Inject private botApi: BotApiService;
    public async getUser(token: string): Promise<DiscordUser> {
        const url = DiscordApi.baseURL + '/users/@me';
        const response = await fetch(url, {
            headers: {Authorization: 'Bearer ' + token}
        });
        return await this.handleResponse(response) as Promise<DiscordUser>;
    }
    public async getUsersGuilds(token: string): Promise<DiscordGuildWithChannels[]> {
        const url = DiscordApi.baseURL + '/users/@me/guilds';
        const response = await fetch(url, {
            headers: {Authorization: 'Bearer ' + token}
        });
        return await this.handleResponse(response) as Promise<DiscordGuildWithChannels[]>;
    }
    /**
     * Returns a list of guilds that both the user and the bot is in. Optionally resolves the channels for a particular guild if a target
     * guild ID is provided as well.
     * @param token - The discord token for the current user, for retrieving the guilds they're in.
     * @param targetGuildId - The target guild ID to get channels for.
     */
    public async getGuilds(token: string, targetGuildId?: string): Promise<IdNamePair[]> {
        const usersGuilds = await this.getUsersGuilds(token);
        const botsGuildMap = await this.botApi.getGuilds().catch(() => {
            throw new Error('Unable to get the list of servers available to the bot.');
        });
        // Filter to users guilds that the bot is available on and the person has MANAGE_CHANNELS permission for
        let targetGuild: DiscordGuildWithChannels;
        const guilds = usersGuilds.filter((guild) => {
            const isValid = typeof (botsGuildMap[guild.id]) !== 'undefined' && this.hasManageGuild(guild);
            if (isValid && guild.id === targetGuildId) {
                targetGuild = guild;
            }
            return isValid;
        });
        // If we have a target guild, resolve channels on it before returning
        if (targetGuild) {
            targetGuild.channels = await this.getGuildChannels(targetGuild.id);
        }
        return guilds;
    }
    /**
     * Returns the specified guild with both channels and roles resolved, if both the user and bot have access to the guild.
     * @param token - The discord token for the current user, for retrieving the guilds they're in.
     * @param guildId - The  guild ID to get.
     */
    public async getGuildDetail(token: string, guildId: string): Promise<SimpleGuild> {
        const usersGuilds = await this.getUsersGuilds(token);
        // TODO Probably more efficient to hit /guilds/<id>/members/<id>, but am lazy atm
        const guild = usersGuilds.find((g) => g.id === guildId);
        if (!guild || !this.hasManageGuild(guild)) {
            throw new Error('That server either doesn\'t exist, or you don\'t have Manage Guild permission to it.');
        }
        const botGuild = await this.botApi.getGuildDetail(guild.id);
        if (!botGuild) {
            throw new Error('The bot couldn\'t find that server. Either it was removed from the server or discord is having issues.');
        }
        return botGuild;
    }
    public async getGuildChannels(guildId: string, token?: string): Promise<IdNamePair[]> {
        // Validate user is allowed to see guild if we're provided a token
        if (token) {
            const usersGuilds = await this.getUsersGuilds(token);
            const targetGuild = usersGuilds.find(guild => guild.id === guildId);
            // Ensure it's a guild they're in and have manage permission to before returning channels
            if (!targetGuild || !this.hasManageGuild(targetGuild)) {
                return Promise.resolve(null as IdNamePair[]);
            }
        }
        return this.botApi.getGuildChannels(guildId);
    }
    public async getGuildRoles(guildId: string, token?: string): Promise<IdNamePair[]> {
        // Validate user is allowed to see guild if we're provided a token
        if (token) {
            const usersGuilds = await this.getUsersGuilds(token);
            const targetGuild = usersGuilds.find(guild => guild.id === guildId);
            // Ensure it's a guild they're in before returning roles
            if (!targetGuild) {
                return Promise.resolve(null as IdNamePair[]);
            }
        }
        return this.botApi.getGuildRoles(guildId);
    }
    private hasManageGuild(guild: DiscordGuild) {
        // eslint-disable-next-line no-bitwise
        return (guild.permissions & 20) !== 0; // 20 = manage guild
    }
    private async handleResponse(response: Response): Promise<unknown> {
        if (response.status !== 200) {
            return Promise.reject(response);
        }
        return response.json();
    }
}
