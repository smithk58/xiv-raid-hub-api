import { DeleteResult, getConnection } from 'typeorm';
import { Inject, Singleton } from 'typescript-ioc';
import { IncomingMessage } from 'http';
import * as cheerio from 'cheerio';
import * as https from 'https';

import { UserCharacter } from '../repository/entity/UserCharacter';
import { Character } from '../repository/entity/Character';
import { UserService } from './UserService';

@Singleton
export class CharacterService {
    @Inject private userService: UserService;
    /**
     * Returns all of the characters for the specified user.
     * @param userId - The ID of the user to get characters for.
     */
    public async getUserCharacters(userId: number): Promise<UserCharacter[]> {
        return getConnection()
            .getRepository(UserCharacter)
            .createQueryBuilder('uc')
            .innerJoin('uc.character', 'character')
            .where('uc."userId" = :userId', {userId})
            .orderBy('character.name', 'ASC')
            .select(['uc', 'character'])
            .getMany();
    }

    /**
     * Adds the specified character to the character list for the specified user. If the character doesn't exist yet it will be inserted.
     * However, if it already exists no changes will be made to it.
     * @param userId - The ID of the user to add a character to.
     * @param character - The ID of the character to add.
     */
    public async createUserCharacter(userId: number, character: Character): Promise<UserCharacter> {
        const userCharacter = new UserCharacter();
        userCharacter.character = character;
        userCharacter.defaultClass = character.defaultClass;
        // Assign current user as owner of the character
        userCharacter.user = await this.userService.getUser(userId);
        return getConnection().getRepository(UserCharacter).save(userCharacter);
    }

    /**
     * Updates the specified character from the users list of characters, and the character itself if the user is confirmed as being the
     * owner of the character.
     * @param userId - The ID of the user to update the character for.
     * @param character - THe ID of the character to update.
     */
    public async updateUserCharacter(userId: number, character: Character): Promise<UserCharacter> {
        // Get current users existing character and search for a possible owner
        const existingCharacter = await getConnection()
            .getRepository(UserCharacter)
            .createQueryBuilder('uc')
            .innerJoin('uc.character', 'character')
            .where('uc."characterId" = :characterId AND (uc."userId" = :userId)', {userId, characterId: character.id})
            .select(['uc', 'character'])
            .getOne();
        if (!existingCharacter) {
            return Promise.resolve(null);
        }
        // A non owner can only update the default class they have assigned
        existingCharacter.defaultClass = character.defaultClass;
        if (existingCharacter.isOwner) {
            existingCharacter.character.name = character.name;
            existingCharacter.character.server = character.server;
        }
        await getConnection().getRepository(UserCharacter).save(existingCharacter);
        return Promise.resolve(existingCharacter);
    }

    /**
     * Deletes the specified character from the users list of characters.
     * @param userId - The ID of the user to delete the character from.
     * @param characterId - The ID of the character to delete.
     */
    public async deleteUserCharacter(userId: number, characterId: number): Promise<DeleteResult> {
        return getConnection()
            .createQueryBuilder()
            .delete()
            .from(UserCharacter)
            .where('"characterId" = :characterId AND "userId" = :userId', {characterId, userId})
            .execute();
    }
    /**
     * Attempts to confirm the specified user is the owner of the specified character ID. Queries the lodestone profile
     * of that character ID for the code of the specified user.
     * @param userId - The ID of the user to confirm the character for.
     * @param characterId - The ID of the character to confirm.
     */
    public async confirmCharacter(userId: number, characterId: number): Promise<boolean> {
        const character = await getConnection()
            .getRepository(UserCharacter)
            .createQueryBuilder('uc')
            .where('uc."characterId" = :characterId AND uc."userId" = :userId', {userId, characterId})
            .getOne();
        if (!character) {
            return Promise.resolve(null);
        }
        const result = await this.checkLodestoneProfileForString(characterId, 'xiv-raid-hub-' + userId);
        if (result) {
            await getConnection()
                .createQueryBuilder()
                .update(UserCharacter)
                .set({isOwner: true})
                .where('"characterId" = :characterId AND "userId" = :userId', {userId, characterId})
                .execute();
        }

        return Promise.resolve(result);
    }

    /**
     * Checks the lodestone profile for the specified character ID, for the provided targetString. Returns whether or not the string was
     * found.
     * @param characterId - The ID of the character whose profile you want to check.
     * @param targetString - The string to search for in the profile.
     */
    private async checkLodestoneProfileForString(characterId: number, targetString: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const req = https.get('https://na.finalfantasyxiv.com/lodestone/character/' + characterId, (response: IncomingMessage) => {
                // Build the response
                let data = '';
                response.on('data', (chunk) => {
                    data += chunk;
                });
                // The whole response has been received.
                response.on('end', () => {
                    // Load the loadstone page into cheerio so we can query it, then search the character intro for the string
                    const $ = cheerio.load(data);
                    const intro = $('.character__selfintroduction');
                    const containsString = intro.length > 0 ? intro.text().indexOf(targetString) > -1 : false;
                    resolve(containsString);
                });
            });
            req.on('error', (err: Error) => {
                reject(err);
            });
            req.end();
        });
    }
}
