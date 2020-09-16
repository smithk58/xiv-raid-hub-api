import { DeleteResult, EntityManager, getConnection, getManager } from "typeorm";
import { RaidGroup } from "../repository/entity/RaidGroup";
import UserService from "./UserService";
import { RaidGroupCharacter } from "../repository/entity/RaidGroupCharacter";
import { validateOrReject } from "class-validator";
import { WeeklyRaidTime } from "../repository/entity/WeeklyRaidTime";

export default class RaidGroupService {
    /**
     * Returns all raid groups a particular user is allowed to see, but not necessarily edit.
     * @param userId
     */
    public static getRaidGroups(userId: number): Promise<RaidGroup[]> {
        // Get all raid groups that are owned by this user, or are shared and they own a character in the static
        // Also filter on accepted status (whether or not they've opted in to being a member of the raid group, or haven't chosen yet)
        return getConnection()
            .getRepository(RaidGroup)
            .createQueryBuilder('group')
            .innerJoin('group.characters', 'characters')
            .leftJoin('user_characters', 'character', 'characters."characterId" = character."characterId"')
            .where('"group"."ownerId" = :userId', {userId: userId})
            .orWhere('(group.share = true AND (character."userId" = :userId AND "isOwner" = true))', {userId: userId})
            .orderBy('group.id', 'ASC')
            .select(['group'])
            .getMany();
    }

    /**
     * Returns a raid group and it's raid group characters.
     * @param userId
     * @param raidGroupId
     */
    public static async getRaidGroupWithCharacters(userId: number, raidGroupId: number): Promise<RaidGroup> {
        return getConnection()
            .getRepository(RaidGroup)
            .createQueryBuilder('group')
            .innerJoin('group.characters', 'characters')
            .innerJoin('characters.character', 'character')
            .where('"group"."id" = :id AND "group"."ownerId" = :userId', {id: raidGroupId, userId: userId})
            .select(['group', 'characters', 'character'])
            .orderBy('characters.order')
            .getOne();
    }
    /**
     * Creates a new raid group and raid group characters.
     * @param userId
     * @param raidGroup
     */
    public static async createRaidGroup(userId: number, raidGroup: RaidGroup): Promise<RaidGroup> {
        delete raidGroup.id;
        // TODO Validate characters in raid group are unique
        // Have to call validateOrReject ourselves, since changes in length of characters[] don't trigger @BeforeInsert() or @BeforeUpdate()
        await validateOrReject(raidGroup, {validationError: {target: false}});
        // Assign current user as owner of the new raid group
        raidGroup.owner = await UserService.getUser(userId);
        return getConnection().getRepository(RaidGroup).save(raidGroup);
    }

    /**
     * Updates a raid group and its raid group characters.
     * @param userId
     * @param raidGroup
     */
    public static async updateRaidGroup(userId: number, raidGroup: RaidGroup) {
        // TODO Validate characters in raid group are unique
        // Ensure the raid group exists and they can edit it before continuing
        const canEdit = await RaidGroupService.canEditRaidGroup(userId, raidGroup.id);
        if(!canEdit) {
            return Promise.resolve(null);
        }
        // Have to call validateOrReject ourselves, since changes in length of characters[] don't trigger @BeforeInsert() or @BeforeUpdate()
        await validateOrReject(raidGroup, {validationError: {target: false}});
        return getManager().transaction(async(entityManager: EntityManager) => {
            // Delete existing raid group characters ourselves, since type ORM can't figure out to do so and runs into a unique constraint error
            await this.deleteRaidGroupCharacters(entityManager, raidGroup.id);
            await entityManager.save(RaidGroup, raidGroup);
            return entityManager.getRepository(RaidGroup).findOne({id: raidGroup.id});
        });
    }

    /**
     * Deletes the specified raid group.
     * @param userId
     * @param raidGroupId
     */
    public static async deleteRaidGroup(userId: number, raidGroupId: number): Promise<DeleteResult> {
        // Ensure the raid group exists and they can edit it before continuing
        const canEdit = await RaidGroupService.canEditRaidGroup(userId, raidGroupId);
        if(!canEdit) {
            return Promise.resolve(null);
        }
        // Wrap all the deletes in a transaction
        return getManager().transaction(async(entityManager: EntityManager) => {
            // Have to delete the related character groups and schedule ourselves, because typeorms cascade is dumb and can't figure out composite keys?
            await this.deleteRaidGroupCharacters(entityManager, raidGroupId);
            await this.deleteWeeklyRaidTimes(entityManager, raidGroupId);
            // Finally delete the actual raid group
            return entityManager
                .createQueryBuilder()
                .delete()
                .from(RaidGroup)
                .where('id = :id AND "ownerId" = :ownerId', {id: raidGroupId, ownerId: userId})
                .execute()
        });
    }

    /**
     * Deletes all of the raid group characters for a particular raid group.
     * @param entityManager
     * @param raidGroupId
     * @private
     */
    private static async deleteRaidGroupCharacters(entityManager: EntityManager, raidGroupId: number): Promise<DeleteResult> {
        return entityManager.createQueryBuilder()
            .delete()
            .from(RaidGroupCharacter)
            .where('raidGroupId = :id', {id: raidGroupId})
            .execute();
    }
    /**
     * Returns the weekly raid times for a particular raid group.
     * @param userId
     * @param raidGroupId
     */
    public static async getWeeklyRaidTimes(userId: number, raidGroupId: number): Promise<WeeklyRaidTime[]> {
        const canSee = await RaidGroupService.canSeeRaidGroup(userId, raidGroupId);
        if(!canSee) {
            return Promise.resolve(null);
        }
        return getConnection()
            .getRepository(WeeklyRaidTime)
            .createQueryBuilder()
            .where('"raidGroupId" = :raidGroupId', {raidGroupId: raidGroupId})
            .getMany()
    }

    /**
     * Returns the weekly raid times for a particular user.
     * @param userId
     */
    public static async getAllWeeklyRaidTimes(userId: number): Promise<WeeklyRaidTime[]> {
        // TODO Make sure this is sorted by earliest -> latest time
        return getConnection()
            .getRepository(WeeklyRaidTime)
            .createQueryBuilder('wrt')
            .innerJoin('wrt.raidGroup', 'group')
            .innerJoin('group.characters', 'characters')
            .leftJoin('user_characters', 'character', 'characters."characterId" = character."characterId"')
            .where('"group"."ownerId" = :userId', {userId: userId})
            .orWhere('(group.share = true AND (character."userId" = :userId AND "isOwner" = true))', {userId: userId})
            .getMany()
    }

    /**
     * Updates the weekly raid times for a raid group to the provided list of raid times.
     * @param userId
     * @param raidGroupId
     * @param raidTimes
     */
    public static async updateWeeklyRaidTimes(userId: number, raidGroupId: number, raidTimes: WeeklyRaidTime[]): Promise<WeeklyRaidTime[]> {
        // Ensure the raid group exists and they can edit it before continuing
        const canEdit = await RaidGroupService.canEditRaidGroup(userId, raidGroupId);
        if(!canEdit) {
            return Promise.resolve(null);
        }
        // Ensure raid group IDs on raid times match the one provided in the URL
        for(const raidTime of raidTimes) {
            raidTime.raidGroupId = raidGroupId
        }
        // Wrap deletes/saves in a transaction
        return getManager().transaction(async(entityManager: EntityManager) => {
            const result = await this.deleteWeeklyRaidTimes(entityManager, raidGroupId);
            // Only update hasSchedule on raid group if going from 0 to >0 or vice versa.
            const noneToSome = result.affected === 0 && raidTimes.length > 0;
            const someToNone = result.affected > 0 && raidTimes.length === 0;
            if (noneToSome || someToNone) {
                await entityManager.createQueryBuilder()
                    .update(RaidGroup)
                    .set({hasSchedule: raidTimes.length > 0})
                    .where('id = :id', {id: raidGroupId})
                    .execute()
            }
            return entityManager
                .getRepository(WeeklyRaidTime)
                .save(raidTimes)
        });

    }
    private static async deleteWeeklyRaidTimes(entityManager: EntityManager, raidGroupId: number): Promise<DeleteResult> {
        return entityManager.createQueryBuilder()
            .delete()
            .from(WeeklyRaidTime)
            .where('"raidGroupId" = :id', {id: raidGroupId})
            .execute();
    }
    private static async canSeeRaidGroup(userId: number, raidGroupId: number): Promise<boolean> {
        return await getConnection()
            .getRepository(RaidGroup)
            .createQueryBuilder('group')
            .innerJoin('group.characters', 'characters')
            .leftJoin('user_characters', 'character', 'characters."characterId" = character."characterId"')
            .where('id = :id AND "ownerId" = :ownerId', {id: raidGroupId, ownerId: userId})
            .orWhere('(group.share = true AND (character."userId" = :userId AND "isOwner" = true))', {userId: userId})
            .getCount() > 0;
    }
    private static async canEditRaidGroup(userId: number, raidGroupId: number): Promise<boolean> {
        return await getConnection()
            .getRepository(RaidGroup)
            .createQueryBuilder()
            .where('id = :id AND "ownerId" = :ownerId', {id: raidGroupId, ownerId: userId})
            .getCount() > 0;
    }
    // TODO clone raid group, should clone characters + schedule as well
}