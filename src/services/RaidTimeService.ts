import { DeleteResult, EntityManager, getConnection, getManager } from 'typeorm';
import { Inject, Singleton } from 'typescript-ioc';

import { RaidGroup } from '../repository/entity/RaidGroup';
import { WeeklyRaidTime } from '../repository/entity/WeeklyRaidTime';
import { UserService } from './UserService';
import { AlarmDefinition } from '../repository/entity/AlarmDefinition';
import { RaidGroupSecurityService } from './RaidGroupSecurityService';
import { AlarmService } from './AlarmService';

@Singleton
export class RaidTimeService {
    @Inject private userService: UserService;
    @Inject private raidGroupSecurity: RaidGroupSecurityService;
    @Inject private alarmService: AlarmService;

    /**
     * Deletes the alarms for the specified raid group. Optionally only deletes the ones for a particular user.
     * @param entityManager -
     * @param raidGroupId - The raid group to delete alarms for.
     * @param userId - (optional) user to delete alarms of.
     */
    public async deleteRaidGroupAlarms(entityManager: EntityManager, raidGroupId: number, userId?: number) {
        const query = entityManager.createQueryBuilder()
            .delete()
            .from(AlarmDefinition)
            .where('"raidGroupId" = :id', {id: raidGroupId});
        if(typeof(userId) !== 'undefined') {
            query.andWhere('"ownerId" = :userId', {userId})
        }
        return query.execute();
    }

    /**
     * Returns the weekly raid times for a particular user.
     * @param userId - The ID of the user you want all raid times for.
     */
    public async getAllWeeklyRaidTimes(userId: number): Promise<WeeklyRaidTime[]> {
        return getConnection()
            .getRepository(WeeklyRaidTime)
            .createQueryBuilder('wrt')
            .innerJoin('wrt.raidGroup', 'group')
            .innerJoin('group.characters', 'characters')
            .leftJoin('user_characters', 'character', 'characters."characterId" = character."characterId"')
            .where('"group"."ownerId" = :userId', {userId})
            .orWhere('(group.share = true AND (character."userId" = :userId AND "isOwner" = true))', {userId})
            .getMany();
    }

    /**
     * Updates the weekly raid times for a raid group to the provided list of raid times.
     * @param userId - The ID of the user you want to update raid times with. Used for permission checking.
     * @param raidGroupId - The ID of the raid group to set the raid times for.
     * @param raidTimes - The list of new raid times for the specified raid group.
     */
    public async updateWeeklyRaidTimes(userId: number, raidGroupId: number, raidTimes: WeeklyRaidTime[]): Promise<WeeklyRaidTime[]> {
        // Ensure the raid group exists and they can edit it before continuing
        const canEdit = await this.raidGroupSecurity.canEditRaidGroup(userId, raidGroupId);
        if (!canEdit) {
            return Promise.resolve(null);
        }
        // Ensure raid group IDs on raid times match the one provided in the URL
        for (const raidTime of raidTimes) {
            raidTime.raidGroupId = raidGroupId;
        }
        // Wrap deletes/saves in a transaction
        return getManager().transaction(async (entityManager: EntityManager) => {
            const result = await this.deleteWeeklyRaidTimes(entityManager, raidGroupId);
            // Only update hasSchedule on raid group if going from 0 to >0 or vice versa.
            const noneToSome = result.affected === 0 && raidTimes.length > 0;
            const someToNone = result.affected > 0 && raidTimes.length === 0;
            if (noneToSome || someToNone) {
                await entityManager.createQueryBuilder()
                    .update(RaidGroup)
                    .set({hasSchedule: raidTimes.length > 0})
                    .where('id = :id', {id: raidGroupId})
                    .execute();
            }
            const savedRaidTimes =  await entityManager
                .getRepository(WeeklyRaidTime)
                .save(raidTimes);
            // Add new alarms for the weekly raid times
            const alarmDefs = await this.alarmService.getAlarmDefinitionsForRaidGroup(raidGroupId);
            await this.alarmService.createAlarms(entityManager, savedRaidTimes, alarmDefs);
            return savedRaidTimes;
        });
    }

    /**
     * Deletes the raid times for the specified raid group.
     * @param entityManager - The entity manager for a transaction.
     * @param raidGroupId - The ID of the raid group to delete all raid times for.
     */
    private async deleteWeeklyRaidTimes(entityManager: EntityManager, raidGroupId: number): Promise<DeleteResult> {
        return entityManager.createQueryBuilder()
            .delete()
            .from(WeeklyRaidTime)
            .where('"raidGroupId" = :id', {id: raidGroupId})
            .execute();
    }
}
