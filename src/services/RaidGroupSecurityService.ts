import { getConnection, getManager } from 'typeorm';
import { Inject, Singleton } from 'typescript-ioc';

import { RaidGroup } from '../repository/entity/RaidGroup';
import { UserService } from './UserService';
import { RaidGroupCharacter } from '../repository/entity/RaidGroupCharacter';
import { UserCharacter } from '../repository/entity/UserCharacter';
import { AllowAddToRaidGroup } from '../models/user-settings/properties';
import { ValidationError } from '../utils/errors/ValidationError';

@Singleton
export class RaidGroupSecurityService {
    @Inject private userService: UserService;

    /**
     * Returns whether or not the specified user is allowed to view information about the specified raid group.
     * @param userId - The ID of the user to check permissions for.
     * @param raidGroupId - The ID of the raid group to check against.
     */
    public async canViewRaidGroup(userId: number, raidGroupId: number): Promise<boolean> {
        // TODO Investigate subquery instead of left join for the sharing stuff.
        return await getConnection()
            .getRepository(RaidGroup)
            .createQueryBuilder('group')
            .leftJoin('group.characters', 'characters')
            .leftJoin('user_characters', 'character', 'characters."characterId" = character."characterId"')
            .where('id = :id AND "ownerId" = :ownerId', {id: raidGroupId, ownerId: userId})
            .orWhere('(group.share = true AND (character."userId" = :userId AND "isOwner" = true))', {userId})
            .getCount() > 0;
    }

    /**
     * Returns whether or not the specified user is allowed to edit information about the specified raid group.
     * @param userId - The ID of the user to check permission for.
     * @param raidGroupId - The ID of the raid group to check against.
     */
    public async canEditRaidGroup(userId: number, raidGroupId: number): Promise<boolean> {
        return await getConnection()
            .getRepository(RaidGroup)
            .createQueryBuilder()
            .where('id = :id AND "ownerId" = :ownerId', {id: raidGroupId, ownerId: userId})
            .getCount() > 0;
    }
    public async canAddCharacters(userId: number, characterIds: number[], sourceCharacters: RaidGroupCharacter[]) {
        const blockedCharacters = await getConnection()
            .getRepository(UserCharacter)
            .createQueryBuilder('uc')
            .innerJoin('user_settings', 'us', 'uc."userId" = us."userId"')
            .where('uc."characterId" IN (:...characterIds)', {characterIds})
            .andWhere('uc."isOwner" = true')
            .andWhere('us.key =\'' + AllowAddToRaidGroup.key + '\'')
            .andWhere('us.value = \'false\'')
            .andWhere('uc.userId <> :userId', {userId})
            .getMany();
        if (blockedCharacters.length > 0) {
            const names = [];
            for (const blockedCharacter of blockedCharacters) {
                const targetCharacter = sourceCharacters.find(c => c.character.id === blockedCharacter.characterId);
                names.push(targetCharacter.character.name);
            }
            throw new ValidationError(
                // tslint:disable-next-line:max-line-length
                'The owners of the following characters have disabled allowing other players to add their characters to raid groups: ' + names.join(', ')
            );
        }
    }
}
