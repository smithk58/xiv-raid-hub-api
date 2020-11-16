import { DeleteResult, EntityManager, getConnection } from 'typeorm';
import { Inject, Singleton } from 'typescript-ioc';
import { PG_UNIQUE_VIOLATION } from '@drdgvhbh/postgres-error-codes';

import { Alarm, AlarmType } from '../repository/entity/Alarm';
import { RaidGroupService } from './RaidGroupService';
import { DiscordApi, DiscordGuildWithChannels } from './api-wrappers/discord/discord-api';
import { UserService } from './UserService';
import { DiscordGuild } from './api-wrappers/discord/DiscordGuild';
import { BotApi } from './api-wrappers/bot/bot-api';
import { DaysOfWeekByJsDay } from '../utils/DaysUtils';
import { ValidationError} from '../utils/errors/ValidationError';
import { SimpleGuild } from './api-wrappers/bot/SimpleGuild';
import { WeeklyRaidTime } from '../repository/entity/WeeklyRaidTime';

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
        const isChannelAlarm = alarm.type === AlarmType.CHANNEL;
        const hasRole = !!alarm.targetRoleId;
        // Confirm the guild is allowed and the selected channel/role are valid
        const targetGuild = await this.getGuildDetail(token, alarm.targetGuildId);
        if (!targetGuild) {
            throw new ValidationError('Invalid discord server. You require Manage Guild permission on the server and both you and the' +
                ' XIV Raid Hub bot need to be in the server.', 'targetGuildId'
            );
        }
        // Validate they have permission for the target server/channel, or assign the user as the target
        if (isChannelAlarm) {
            // Confirm the channel exists on the target server
            const targetChannel = targetGuild.channels.find(channel => channel.id === alarm.targetId);
            if (!targetChannel) {
                throw new ValidationError('Invalid discord channel. Perhaps the the channel was deleted before you saved the alarm, or the bot' +
                    'can\'t see the channel?', 'targetId'
                );
            }
            alarm.targetName = targetGuild.name + ' / ' + targetChannel.name;
            // Confirm role exists on target server, set its name if found, otherwise explicitly clear the fields
            if (hasRole) {
                const targetRole = targetGuild.roles.find(role => role.id === alarm.targetRoleId);
                if (!targetRole) {
                    throw new ValidationError('Invalid discord role. Perhaps the the role was deleted before you saved the alarm.', 'targetId');
                }
                alarm.targetRoleName = targetRole.name;
            }
        } else {
            alarm.targetName = targetGuild.name + ' / ' + 'DM to you';
            alarm.targetId = userDiscordId;
        }
        // Clear out role fields if no role
        if (!hasRole) {
            alarm.targetRoleId = null;
            alarm.targetRoleName = null;
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

    public async deleteRaidGroupAlarms(entityManager: EntityManager, raidGroupId: number) {
        return entityManager.createQueryBuilder()
            .delete()
            .from(Alarm)
            .where('"raidGroupId" = :id', {id: raidGroupId})
            .execute();
    }
    /**
     * Returns the specified guild with both channels and roles resolved, if both the user and bot have access to the guild.
     * @param token - The discord token for the current user, for retrieving the guilds they're in.
     * @param guildId - The  guild ID to get.
     */
    public async getGuildDetail(token: string, guildId: string) {
        const usersGuilds = await this.discordApi.getGuilds(token);
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
    /**
     * Returns a list of guilds that both the user and the bot is in. Optionally resolves the channels for a particular guild if a target
     * guild ID is provided as well.
     * @param token - The discord token for the current user, for retrieving the guilds they're in.
     * @param targetGuildId - The target guild ID to get channels for.
     */
    public async getGuilds(token: string, targetGuildId?: string) {
        const usersGuilds = await this.discordApi.getGuilds(token);
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
    public async getGuildChannels(guildId: string, token?: string) {
        // Validate user is allowed to see guild if we're provided a token
        if (token) {
            const usersGuilds = await this.discordApi.getGuilds(token);
            const targetGuild = usersGuilds.find(guild => guild.id === guildId);
            // Ensure it's a guild they're in and have manage permission to before returning channels
            if (!targetGuild || !this.hasManageGuild(targetGuild)) {
                return Promise.resolve(null);
            }
        }
        return this.botApi.getGuildChannels(guildId);
    }
    public async getGuildRoles(guildId: string, token?: string) {
        // Validate user is allowed to see guild if we're provided a token
        if (token) {
            const usersGuilds = await this.discordApi.getGuilds(token);
            const targetGuild = usersGuilds.find(guild => guild.id === guildId);
            // Ensure it's a guild they're in before returning roles
            if (!targetGuild) {
                return Promise.resolve(null);
            }
        }
        return this.botApi.getGuildRoles(guildId);
    }
    public async getScheduledAlarms(utcHour: number, utcMinute: number) {
        // Get the bits for the current and next day, alarms we care about can be on either of them
        const jsDay = new Date().getUTCDay();
        const curDayBit = DaysOfWeekByJsDay.get(jsDay).bit;
        const nextDayBit = DaysOfWeekByJsDay.get(jsDay === 6 ? 0 : jsDay + 1).bit;
        return await getConnection()
            .getRepository(Alarm)
            .createQueryBuilder('a')
            .innerJoin('weekly_raid_times', 'wrt', 'a."raidGroupId" = wrt."raidGroupId"')
            .innerJoin('a.raidGroup', 'group')
            .where('a."isEnabled" = true')
            .andWhere('wrt."utcMinute" = :utcMinute', {utcMinute})
            .andWhere(
                '(wrt."utcHour" - a."offsetHour" = :utcHour AND wrt."weekMask" & :curDayBit > 0)' +
                'OR' +
                '(wrt."utcHour" + 24 - a."offsetHour" = :utcHour AND wrt."weekMask" & :nextDayBit > 0)',
                {utcHour, curDayBit, nextDayBit}
            )
            .select(['a', 'group'])
            .getMany();
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
