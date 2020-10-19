import { DeleteResult, getConnection } from 'typeorm';
import { Inject, Singleton } from 'typescript-ioc';
import { PG_UNIQUE_VIOLATION } from '@drdgvhbh/postgres-error-codes';

import { Alarm, AlarmType } from '../repository/entity/Alarm';
import { RaidGroupService } from './RaidGroupService';
import { DiscordApi, DiscordGuildWithChannels } from './api-wrappers/discord/discord-api';
import { UserService } from './UserService';
import { DiscordGuild } from './api-wrappers/discord/DiscordGuild';
import { BotApi } from './api-wrappers/bot-api';

@Singleton
export class AlarmService {
    @Inject private raidGroupService: RaidGroupService;
    @Inject private discordApi: DiscordApi;
    @Inject private userService: UserService;
    @Inject private botApi: BotApi;
    public async getAlarms(userId: number) {
        return getConnection()
            .getRepository(Alarm)
            .createQueryBuilder('alarm')
            .innerJoin('alarm.raidGroup', 'group')
            .where('"alarm"."ownerId" = :userId', {userId})
            .orderBy('group.id', 'ASC')
            .select(['alarm', 'group'])
            .getMany();
    }
    public async createAlarm(alarm: Alarm, userId: number, userDiscordId: string, token: string) {
        // Can only create an alarm for a raid group that you can view
        const canAddAlarm = await this.raidGroupService.canViewRaidGroup(userId, alarm.raidGroupId);
        if (!canAddAlarm) {
            return Promise.resolve(null);
        }
        return this.saveAlarm(alarm, userId, userDiscordId, token);
    }
    public async updateAlarm(alarm: Alarm, userId: number, userDiscordId: string, token: string) {
        // Can only update the alarm if you can edit rights and can view the raid group you're assigning it to
        const canEdit = await this.canEditAlarm(userId, alarm.id);
        if (!canEdit) {
            return Promise.resolve(null);
        }
        const canViewRaidGroup = await this.raidGroupService.canViewRaidGroup(userId, alarm.raidGroupId);
        if (!canViewRaidGroup) {
            return Promise.resolve(null);
        }
        return this.saveAlarm(alarm, userId, userDiscordId, token);
    }
    private async saveAlarm(alarm: Alarm, userId: number, userDiscordId: string, token: string) {
        // Validate they have permission for the target server/channel, or assign the user as the target
        if (alarm.type === AlarmType.CHANNEL) {
            const targetSplit = alarm.targetId.split('_');
            const targetGuildId = targetSplit.length > 0 ? targetSplit[0] : '';
            const targetChannelId = targetSplit.length > 1 ? targetSplit[1] : '';
            // Check if the guild exists in their available guilds, if so, confirm the channel exists as well
            const guilds = await this.getGuilds(token, targetGuildId);
            const targetGuild = guilds.find(guild => guild.id = targetGuildId);
            const targetChannel = targetGuild ? targetGuild.channels.find(channel => channel.id === targetChannelId) : '';
            if (!targetGuild || !targetChannel) {
                const err = !targetGuild ? 'The target server doesn\'t appear to exist, or you don\'t have Manage Guild permission on it' :
                    'The target channel doesn\'t appear to exist on that server, perhaps someone deleted it?';
                throw new Error('Invalid alarm target. ' + err);
            }
            alarm.targetName = targetGuild.name + ' / ' + targetChannel.name;
        } else {
            alarm.targetId = userDiscordId;
        }
        alarm.ownerId = userId;
        const savedAlarm = await getConnection().getRepository(Alarm).save(alarm).catch(this.duplicateAlarmHandler);
        savedAlarm.raidGroup = await this.raidGroupService.getRaidGroup(savedAlarm.raidGroupId);
        return savedAlarm;
    }
    public async deleteAlarm(userId: number, alarmId: number): Promise<DeleteResult> {
        const canEditAlarm = await this.canEditAlarm(userId, alarmId);
        if (!canEditAlarm) {
            return Promise.resolve(null);
        }
        return getConnection().createQueryBuilder()
            .delete()
            .from(Alarm)
            .where('id = :id', {id: alarmId})
            .execute();
    }
    public async getGuilds(token: string, targetGuildId?: string) {
        const usersGuilds = await this.discordApi.getGuilds(token);
        const botsGuildMap = await this.botApi.getGuilds().catch(() => {
            throw new Error('Unable to get the list of servers available to the bot.');
        }) as Record<string, DiscordGuildWithChannels>;
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
    public async getGuildChannels(guildId: string, token?: string) {
        // Validate user is allowed to see guild if we're provided a token
        if (token) {
            const usersGuilds = await this.discordApi.getGuilds(token);
            const targetGuild = usersGuilds.find(guild => guild.id === guildId);
            // Ensure it's a guild they're in and have manage permission to before turning channels
            if (!targetGuild || !this.hasManageGuild(targetGuild)) {
                return Promise.resolve(null);
            }
        }
        return this.botApi.getGuildChannels(guildId);
    }
    private async canEditAlarm(userId: number, alarmId: number): Promise<boolean> {
        return await getConnection()
            .getRepository(Alarm)
            .createQueryBuilder('alarm')
            .where('alarm.id = :alarmId AND alarm."ownerId" = :userId', {alarmId, userId})
            .getCount() > 0;
    }
    private hasManageGuild(guild: DiscordGuild) {
        // tslint:disable-next-line:no-bitwise
        return (guild.permissions & 20) !== 0; // 20 = manage guild
    }
    private duplicateAlarmHandler(error: any): never {
        if (error.code === PG_UNIQUE_VIOLATION) {
            throw new Error('There\'s already an alarm like that! Maybe someone in your raid group already set one up?');
        }
        throw error;
    }
}
