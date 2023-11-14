import { DeleteResult, EntityManager } from 'typeorm';
import { Inject, Singleton } from 'typescript-ioc';
import { PG_UNIQUE_VIOLATION } from '@drdgvhbh/postgres-error-codes';

import { AlarmDefinition } from '../repository/entity/AlarmDefinition';
import { RaidGroupService } from './RaidGroupService';
import { DiscordApi } from './api-wrappers/discord/discord-api';
import { UserService } from './UserService';
import { DaysOfWeekByJsDay } from '../utils/DaysUtils';
import { ValidationError} from '../utils/errors/ValidationError';
import { WeeklyRaidTime } from '../repository/entity/WeeklyRaidTime';
import { Alarm } from '../repository/entity/Alarm';
import { RaidGroupSecurityService } from './RaidGroupSecurityService';
import { AlarmType } from '../models/AlarmType';
import AppDataSource from '../db-connection';

@Singleton
export class AlarmService {
    @Inject private raidGroupService: RaidGroupService;
    @Inject private raidGroupSecurity: RaidGroupSecurityService;
    @Inject private discordApi: DiscordApi;
    @Inject private userService: UserService;

    public async getAlarmDefinitions(userId: number) {
        return AppDataSource
            .getRepository(AlarmDefinition)
            .createQueryBuilder('alarm')
            .innerJoin('alarm.raidGroup', 'group')
            .where('"alarm"."ownerId" = :userId', {userId})
            .orderBy('group.id', 'ASC')
            .select(['alarm', 'group'])
            .getMany();
    }
    public async getAlarmDefinitionsForRaidGroup(raidGroupId: number) {
        return AppDataSource
            .getRepository(AlarmDefinition)
            .createQueryBuilder('alarm')
            .where('"alarm"."raidGroupId" = :raidGroupId', {raidGroupId})
            .getMany();
    }
    public async createAlarmDefinition(alarm: AlarmDefinition, userId: number, userDiscordId: string, token: string) {
        // Can only create an alarm for a raid group that you can view
        const canAddAlarm = await this.raidGroupSecurity.canViewRaidGroup(userId, alarm.raidGroupId);
        if (!canAddAlarm) {
            return Promise.resolve(null);
        }
        return this.saveAlarmDefinition(alarm, userId, userDiscordId, token);
    }
    public async updateAlarmDefinition(alarm: AlarmDefinition, userId: number, userDiscordId: string, token: string) {
        // Can only update the alarm if you can edit rights and can view the raid group you're assigning it to
        const canEdit = await this.canEditAlarm(userId, alarm.id);
        if (!canEdit) {
            return Promise.resolve(null);
        }
        const canViewRaidGroup = await this.raidGroupSecurity.canViewRaidGroup(userId, alarm.raidGroupId);
        if (!canViewRaidGroup) {
            return Promise.resolve(null);
        }
        return this.saveAlarmDefinition(alarm, userId, userDiscordId, token);
    }
    public async deleteAlarmDefinition(userId: number, alarmId: number): Promise<DeleteResult> {
        const canEditAlarm = await this.canEditAlarm(userId, alarmId);
        if (!canEditAlarm) {
            return Promise.resolve(null as DeleteResult);
        }
        return AppDataSource.createQueryBuilder()
            .delete()
            .from(AlarmDefinition)
            .where('id = :id', {id: alarmId})
            .execute();
    }

    /**
     * Generates alarms for the provided raid times and alarm definitions.
     * @param entityManager -
     * @param weeklyRaidTimes - The raid times that the alarms should be set to notify for.
     * @param alarmDefs - The alarm definitions to apply to each of the raid times.
     */
    public async createAlarms(entityManager: EntityManager, weeklyRaidTimes: WeeklyRaidTime[], alarmDefs: AlarmDefinition[]) {
        const alarms: Alarm[] = [];
        for (const raidTime of weeklyRaidTimes) {
            const utcTimeInMinutes = (raidTime.utcHour * 60) + raidTime.utcMinute;
            for (const alarmDef of alarmDefs) {
                const alarmOffsetMinutes = (alarmDef.offsetHour * 60);
                // Calculate alarm time, handle wrapping to next day via modulo
                const utcAlarmTimeInMinutes = (((utcTimeInMinutes - alarmOffsetMinutes) % 1440) + 1440) % 1440;
                alarms.push(new Alarm(
                    alarmDef.id,
                    raidTime.id,
                    Math.floor(utcAlarmTimeInMinutes / 60),
                    utcAlarmTimeInMinutes % 60,
                    raidTime.utcWeekMask
                ));
            }
        }
        return entityManager.save(alarms);
    }
    /**
     * Returns the weekly raid times for a particular raid group.
     * @param userId - The ID of the user you want the raid times for. Used for permission checking.
     * @param raidGroupId. The ID of the raid group you want raid times for.
     */
    public async getWeeklyRaidTimes(userId: number, raidGroupId: number): Promise<WeeklyRaidTime[]> {
        const canSee = await this.raidGroupSecurity.canViewRaidGroup(userId, raidGroupId);
        if (!canSee) {
            return Promise.resolve(null as WeeklyRaidTime[]);
        }
        return AppDataSource
            .getRepository(WeeklyRaidTime)
            .createQueryBuilder()
            .where('"raidGroupId" = :raidGroupId', {raidGroupId})
            .getMany();
    }
    public async getScheduledAlarms(utcHour: number, utcMinute: number) {
        // Get the bits for the current and next day, alarms we care about can be on either of them
        const jsDay = new Date().getUTCDay();
        const curDayBit = DaysOfWeekByJsDay.get(jsDay).bit;
        // Get all alarms whose hours match the current hour
        return await AppDataSource
            .getRepository(AlarmDefinition)
            .createQueryBuilder('ad')
            .innerJoin('ad.alarms', 'a')
            .innerJoin('ad.raidGroup', 'rg')
            .where('ad."isEnabled" = true')
            .andWhere('a."utcHour" = :utcHour AND a."utcMinute" = :utcMinute', {utcHour, utcMinute})
            .andWhere('(a."utcWeekMask" & :curDayBit) > 0', {curDayBit})
            .select(['ad', 'rg'])
            .getMany();
    }
    public async updateAlarmStatus(userId: number, isEnabled: boolean, channelId?: string) {
        const query = AppDataSource.createQueryBuilder()
            .update(AlarmDefinition)
            .set({isEnabled})
            .where('"userId" = :userId', {userId});
        if (channelId) {
            query.andWhere('type = :type AND "targetId" = :channelId"', {type: AlarmType.CHANNEL, channelId})
        }
        return query.execute();
    }
    private async saveAlarmDefinition(alarmDef: AlarmDefinition, userId: number, userDiscordId: string, token: string) {
        // Generate alarms for this alarm definition
        const weeklyRaidTimes = await this.getWeeklyRaidTimes(userId, alarmDef.raidGroupId);
        // Not allowed to see the raid group if weekly times are null
        if (weeklyRaidTimes === null) {
            return Promise.resolve(null);
        }
        // Confirm the guild is allowed and the selected channel/role are valid
        const isChannelAlarm = alarmDef.type === AlarmType.CHANNEL;
        const hasRole = !!alarmDef.targetRoleId;
        // Confirm the guild is allowed and the selected channel/role are valid
        const targetGuild = await this.discordApi.getGuildDetail(token, alarmDef.targetGuildId);
        if (!targetGuild) {
            throw new ValidationError('Invalid discord server. You require Manage Guild permission on the server and both you and the' +
                ' XIV Raid Hub bot need to be in the server.', 'targetGuildId'
            );
        }
        // Validate they have permission for the target server/channel, or assign the user as the target
        if (isChannelAlarm) {
            // Confirm the channel exists on the target server
            const targetChannel = targetGuild.channels.find(channel => channel.id === alarmDef.targetId);
            if (!targetChannel) {
                throw new ValidationError('Invalid discord channel. Perhaps the the channel was deleted before you saved the ' +
                    'alarm, or the bot can\'t see the channel.', 'targetId'
                );
            }
            alarmDef.targetName = targetGuild.name + ' / ' + targetChannel.name;
            // Confirm role exists on target server, set its name if found, otherwise explicitly clear the fields
            if (hasRole) {
                const targetRole = targetGuild.roles.find(role => role.id === alarmDef.targetRoleId);
                if (!targetRole) {
                    throw new ValidationError('Invalid discord role. Perhaps the the role was deleted before you saved the' +
                        'alarm.', 'targetId'
                    );
                }
                alarmDef.targetRoleName = targetRole.name;
            }
        } else {
            alarmDef.targetName = targetGuild.name + ' / ' + 'DM to you';
            alarmDef.targetId = userDiscordId;
        }
        // Clear out role fields if no role
        if (!hasRole) {
            alarmDef.targetRoleId = null;
            alarmDef.targetRoleName = null;
        }
        alarmDef.ownerId = userId;
        // Wrap all saves in a transaction
        return AppDataSource.transaction(async (entityManager: EntityManager) => {
            // eslint-disable-next-line
            const savedAlarmDef = await entityManager.getRepository(AlarmDefinition).save(alarmDef).catch(this.duplicateAlarmHandler.bind(this));
            savedAlarmDef.raidGroup = await this.raidGroupService.getRaidGroup(savedAlarmDef.raidGroupId);
            // Remove existing alarms
            const alarmRepo = entityManager.getRepository(Alarm);
            await alarmRepo.delete({alarmDefinitionId: savedAlarmDef.id});
            // Add/update alarms for the alarm def
            await this.createAlarms(entityManager, weeklyRaidTimes, [savedAlarmDef]);
            return savedAlarmDef;
        });
    }
    private async canEditAlarm(userId: number, alarmId: number): Promise<boolean> {
        return await AppDataSource
            .getRepository(AlarmDefinition)
            .createQueryBuilder('alarm')
            .where('alarm.id = :alarmId AND alarm."ownerId" = :userId', {alarmId, userId})
            .getCount() > 0;
    }
    private duplicateAlarmHandler(error: {code: string}): never {
        if (error.code === PG_UNIQUE_VIOLATION) {
            throw new Error('There\'s already an alarm like that! Maybe someone in your raid group already set one up?');
        }
        throw error;
    }
}
