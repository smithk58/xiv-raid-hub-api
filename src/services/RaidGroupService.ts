import { DeleteResult, EntityManager } from 'typeorm';
import { Inject, Singleton } from 'typescript-ioc';

import { RaidGroup } from '../repository/entity/RaidGroup';
import { RaidGroupCharacter } from '../repository/entity/RaidGroupCharacter';
import { UserService } from './UserService';
import { AlarmDefinition } from '../repository/entity/AlarmDefinition';
import { RaidGroupSecurityService } from './RaidGroupSecurityService';
import AppDataSource from '../db-connection';

@Singleton
export class RaidGroupService {
    @Inject private userService: UserService;
    @Inject private raidGroupSecurity: RaidGroupSecurityService;
    /**
     * Returns all raid groups a particular user is allowed to see, but not necessarily edit. A user is allowed to see raid groups they
     * created, and raid groups that others created that have 'share' enabled, and have a character in them that is confirmed to be owned
     * by the provided user.
     * @param userId - The ID of the user to get raids groups for.
     */
    public getRaidGroups(userId: number): Promise<RaidGroup[]> {
        // Get all raid groups that are owned by this user, or are shared and they own a character in the static
        // Also filter on accepted status (whether or not they've opted in to being a member of the raid group, or haven't chosen yet)
        return AppDataSource
            .getRepository(RaidGroup)
            .createQueryBuilder('group')
            .leftJoin('group.characters', 'characters')
            .leftJoin('user_characters', 'character', 'characters."characterId" = character."characterId"')
            .where('"group"."ownerId" = :userId', {userId})
            .orWhere('(group.share = true AND (character."userId" = :userId AND "isOwner" = true))', {userId})
            .orderBy('group.id', 'ASC')
            .select(['group'])
            .getMany();
    }
    public getRaidGroup(raidGroupId: number): Promise<RaidGroup> {
        return AppDataSource.getRepository(RaidGroup).findOne({where: {id: raidGroupId}});
    }
    /**
     * Returns a raid group and it's raid group characters.
     * @param userId - The ID of the user you're getting the raid group for. Used for permission checking.
     * @param raidGroupId - The ID of the raid group you want to get.
     */
    public async getRaidGroupWithCharacters(userId: number, raidGroupId: number): Promise<RaidGroup> {
        // Ensure the raid group exists and they at least have view access
        const canView = await this.raidGroupSecurity.canViewRaidGroup(userId, raidGroupId);
        if (!canView) {
            return Promise.resolve(null as RaidGroup);
        }
        const raidGroup = await AppDataSource
            .getRepository(RaidGroup)
            .createQueryBuilder('group')
            .leftJoin('group.characters', 'characters')
            .leftJoin('characters.character', 'character')
            .where('"group"."id" = :raidGroupId', {raidGroupId})
            .select(['group', 'characters', 'character'])
            .orderBy('characters.order')
            .getOne();
        // TODO do this via addSelectAndMap when typeorm releases in 0.3.0
        if (raidGroup) {
            raidGroup.isOwner = raidGroup.ownerId === userId;
        }
        return raidGroup;
    }
    /**
     * Creates a new raid group and raid group characters.
     * @param userId - The ID of the user to create the raid group for.
     * @param raidGroup - The raid group to insert for the user.
     */
    public async createRaidGroup(userId: number, raidGroup: RaidGroup): Promise<RaidGroup> {
        delete raidGroup.id;
        // Validate characters if we're including any on the raid group
        if (raidGroup.hasCharacters) {
            if (!raidGroup.characters || raidGroup.characters.length < 8) {
                return Promise.reject('Must have 8 characters in a raid group');
            }
            // Confirm the characters all allow people to add them to raid groups
            const newCharacterIds = raidGroup.characters.map((rgChar) => rgChar.character ? rgChar.character.id : rgChar.characterId);
            await this.raidGroupSecurity.canAddCharacters(userId, newCharacterIds, raidGroup.characters);
        } else {
            raidGroup.share = false;
            raidGroup.characters = []
        }
        // Assign current user as owner of the new raid group
        raidGroup.owner = await this.userService.getUser(userId);
        raidGroup.isOwner = true;
        return AppDataSource.getRepository(RaidGroup).save(raidGroup);
    }
    public async copyRaidGroup(userId: number, raidGroupId: number): Promise<RaidGroup> {
        const groupToClone = await this.getRaidGroupWithCharacters(userId, raidGroupId);
        if (!groupToClone) {
            return Promise.resolve(null as RaidGroup);
        }
        delete groupToClone.id;
        groupToClone.name += ' Copy';
        groupToClone.hasSchedule = false;
        groupToClone.share = false;
        // Assign current user as owner of the new raid group
        groupToClone.owner = await this.userService.getUser(userId);
        groupToClone.ownerId = userId;
        groupToClone.isOwner = true;
        return AppDataSource.getRepository(RaidGroup).save(groupToClone);
    }
    /**
     * Updates a raid group and its raid group characters.
     * @param userId - The ID of the user to update the raid group as. Used for permission checking.
     * @param raidGroup - The raid group to update.
     */
    public async updateRaidGroup(userId: number, raidGroup: RaidGroup) {
        // TODO Validate characters in raid group are unique
        // TODO Remove alarms from people that are removed from a raid group, check if can auto cascade
        // Ensure the raid group exists and they can edit it before continuing
        const canEdit = await this.raidGroupSecurity.canEditRaidGroup(userId, raidGroup.id);
        if (!canEdit) {
            return Promise.resolve(null);
        }
        const existingRaidGroup = await this.getRaidGroupWithCharacters(userId, raidGroup.id);
        if (raidGroup.hasCharacters) {
            if (!raidGroup.characters || raidGroup.characters.length < 8) {
                return Promise.reject('Must have 8 characters in a raid group');
            }
            // Check if they've added a new character, if so we have to confirm they haven't disallowed being added to raid groups
            const newCharacterIds = existingRaidGroup.getNewCharacterIds(raidGroup.characters);
            if (newCharacterIds.length > 0) {
                await this.raidGroupSecurity.canAddCharacters(userId, newCharacterIds, raidGroup.characters);
            }
        } else {
            raidGroup.share = false;
            raidGroup.characters = [];
        }
        // Check if they've made any changes to the raid group characters
        const charactersModified = !existingRaidGroup.isEqualCharacters(raidGroup.characters);
        return AppDataSource.transaction(async (entityManager: EntityManager) => {
            // Delete existing raid group characters if they were changed, since type ORM can't figure out to do so and runs into a
            // unique constraint error, otherwise remove them from the group before saving so it doesn't attempt to save them
            if (charactersModified) {
                await this.deleteRaidGroupCharacters(entityManager, raidGroup.id);
            } else {
                delete raidGroup.characters;
            }
            await entityManager.save(RaidGroup, raidGroup);
            // Have to reselect the the raid group to get owner information
            const updatedRaidGroup = await entityManager.getRepository(RaidGroup)
                .createQueryBuilder('group')
                .where('"group"."id" = :raidGroupId', {raidGroupId: raidGroup.id})
                .select(['group'])
                .getOne();
            // TODO do this via addSelectAndMap when typeorm releases in 0.3.0
            if (updatedRaidGroup) {
                updatedRaidGroup.isOwner = updatedRaidGroup.ownerId === userId;
            }
            return updatedRaidGroup;
        });
    }

    /**
     * Deletes the specified raid group.
     * @param userId - The ID of the user to delete the raid group as. Used for permission checking.
     * @param raidGroupId - The ID of the raid group to delete.
     */
    public async deleteRaidGroup(userId: number, raidGroupId: number): Promise<DeleteResult> {
        // Ensure the raid group exists and they can edit it before continuing
        const canEdit = await this.raidGroupSecurity.canEditRaidGroup(userId, raidGroupId);
        if (!canEdit) {
            return Promise.resolve(null as DeleteResult);
        }
        // Wrap all the deletes in a transaction
        return AppDataSource.transaction(async (entityManager: EntityManager) => {
            // Have to delete the related character groups and schedule, because typeorms cascade can't figure out composite keys?
            await this.deleteRaidGroupCharacters(entityManager, raidGroupId);
            await this.deleteRaidGroupAlarms(entityManager, raidGroupId);
            // Finally delete the actual raid group
            return entityManager
                .createQueryBuilder()
                .delete()
                .from(RaidGroup)
                .where('id = :id AND "ownerId" = :ownerId', {id: raidGroupId, ownerId: userId})
                .execute();
        });
    }

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
     * Removes any characters from a raid group that belong to a particular user.
     * @param userId - The ID of the user to delete raid group characters for.
     * @param raidGroupId - The ID of the raid group to remove characters from.
     */
    public async deleteRaidGroupCharactersForUser(userId: number, raidGroupId: number): Promise<RaidGroupCharacter[]> {
        // TODO Flag/notification on raid group noting that it has too few characters now?
        // Ensure the raid group exists and they at least have view access
        const canView = await this.raidGroupSecurity.canViewRaidGroup(userId, raidGroupId);
        if (!canView) {
            return Promise.resolve(null as RaidGroupCharacter[]);
        }
        return AppDataSource.transaction(async (entityManager: EntityManager) => {
            await this.deleteRaidGroupAlarms(entityManager, raidGroupId);
            const usersCharacters = await entityManager.getRepository(RaidGroupCharacter)
                .createQueryBuilder('rc')
                .innerJoin('user_characters', 'uc', 'uc."characterId" = rc."characterId"')
                .where('uc."userId" = :userId AND "isOwner" = true', {userId})
                .andWhere('rc."raidGroupId" = :raidGroupId', {raidGroupId})
                .select('rc')
                .getMany();
            return entityManager.getRepository(RaidGroupCharacter).remove(usersCharacters);
        });
    }
    /**
     * Deletes all of the raid group characters for a particular raid group.
     * @param entityManager - The entity manager for a transaction.
     * @param raidGroupId - The ID of the raid group to remove all characters from.
     */
    private async deleteRaidGroupCharacters(entityManager: EntityManager, raidGroupId: number): Promise<DeleteResult> {
        return entityManager.createQueryBuilder()
            .delete()
            .from(RaidGroupCharacter)
            .where('raidGroupId = :id', {id: raidGroupId})
            .execute();
    }
}
