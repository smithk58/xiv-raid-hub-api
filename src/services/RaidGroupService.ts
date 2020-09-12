import { DeleteResult, EntityManager, getConnection, getManager } from "typeorm";
import { RaidGroup } from "../repository/entity/RaidGroup";
import UserService from "./UserService";
import { RaidGroupCharacter } from "../repository/entity/RaidGroupCharacter";
import { validateOrReject } from "class-validator";

export default class RaidGroupService {
    public static getRaidGroups(userId: number): Promise<RaidGroup[]> {
        // Get all raid groups that are owned by this user, or are shared and they own a character in the static
        // Also filter on accepted status (whether or not they've opted in to being a member of the raid group, or haven't chosen yet)
        return getConnection()
            .getRepository(RaidGroup)
            .createQueryBuilder('group')
            .innerJoin("group.characters", "characters")
            .innerJoin("characters.character", "character")
            .where('"group"."ownerId" = :userId', {userId: userId})
            .orWhere('(group.share = true AND character."userId" = :userId)', {userId: userId})
            .select(['group'])
            .getMany();
    }
    public static async getRaidGroup(userId: number, raidGroupId: number): Promise<RaidGroup> {
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
    public static async createRaidGroup(userId: number, raidGroup: RaidGroup): Promise<RaidGroup> {
        if(typeof(raidGroup.id) !== 'undefined') {
            throw new Error('A new raid group can\'t have an ID set on it.');
        }
        // Have to call validateOrReject ourselves, since changes in length of characters[] don't trigger @BeforeInsert() or @BeforeUpdate()
        await validateOrReject(raidGroup, {validationError: {target: false}});
        // Assign current user as owner of the new raid group
        raidGroup.owner = await UserService.getUser(userId);
        return getConnection().getRepository(RaidGroup).save(raidGroup);
    }
    public static async updateRaidGroup(userId: number, raidGroup: RaidGroup) {
        // Have to call validateOrReject ourselves, since changes in length of characters[] don't trigger @BeforeInsert() or @BeforeUpdate()
        await validateOrReject(raidGroup, {validationError: {target: false}});
        return getManager().transaction(async(entityManager: EntityManager) => {
            // Delete existing raid group characters ourselves, since type ORM can't figure out to do so and runs into a unique constraint error
            await this.deleteRaidGroupCharacters(entityManager, raidGroup.id);
            return entityManager.save(RaidGroup, raidGroup);
        });
    }
    public static async deleteRaidGroup(userId: number, raidGroupId: number): Promise<DeleteResult> {
        // Ensure the raid group exists and they own it before continuing
        const existsAndIsOwner = await getConnection()
            .getRepository(RaidGroup)
            .createQueryBuilder('group')
            .where('"group"."id" = :id AND "group"."ownerId" = :userId', {id: raidGroupId, userId: userId})
            .getCount() > 0;
        if(!existsAndIsOwner) {
            return null;
        }
        // Wrap all the deletes in a transaction
        return getManager().transaction(async(entityManager: EntityManager) => {
            // Have to delete the related character groups ourselves, because typeorms cascade is dumb and can't figure out composite keys?
            await this.deleteRaidGroupCharacters(entityManager, raidGroupId);
            // TODO Delete schedules
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
    // TODO clone raid group, should clone characters + schedule as well
}
