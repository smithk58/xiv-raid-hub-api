import { DeleteResult, getConnection } from "typeorm";

import { UserCharacter } from "../repository/entity/UserCharacter";
import UserService from "./UserService";
import { Character } from "../repository/entity/Character";
import { IncomingMessage } from "http";
const cheerio = require('cheerio');
const https = require('https')

export default class CharacterService {
    public static async getUserCharacters(userId: number): Promise<UserCharacter[]> {
        return getConnection()
            .getRepository(UserCharacter)
            .createQueryBuilder('uc')
            .innerJoin('uc.character', 'character')
            .where('uc."userId" = :userId', {userId: userId})
            .orderBy('character.name', 'ASC')
            .select(['uc', 'character'])
            .getMany();
    }
    public static async createUserCharacter(userId: number, character: Character): Promise<UserCharacter> {
        const userCharacter = new UserCharacter();
        userCharacter.character = character;
        userCharacter.defaultClass = character.defaultClass;
        // Assign current user as owner of the character
        userCharacter.user = await UserService.getUser(userId);
        return getConnection().getRepository(UserCharacter).save(userCharacter);
    }

    public static async updateUserCharacter(userId: number, character: Character): Promise<UserCharacter> {
        // Get current users existing character and search for a possible owner
        const existingCharacter = await getConnection()
            .getRepository(UserCharacter)
            .createQueryBuilder('uc')
            .innerJoin('uc.character', 'character')
            .where('uc."characterId" = :characterId AND (uc."userId" = :userId)', {userId: userId, characterId: character.id})
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
    public static async deleteUserCharacter(userId: number, characterId: number): Promise<DeleteResult> {
        return getConnection()
            .createQueryBuilder()
            .delete()
            .from(UserCharacter)
            .where('"characterId" = :characterId AND "userId" = :userId', {characterId: characterId, userId: userId})
            .execute();
    }
    /**
     * Attempts to confirm the specified user is the owner of the specified character ID. Queries the lodestone profile
     * of that character ID for the code of the specified user.
     * @param userId
     * @param characterId
     */
    public static async confirmCharacter(userId: number, characterId: number): Promise<boolean> {
        const character = await getConnection()
            .getRepository(UserCharacter)
            .createQueryBuilder('uc')
            .where('uc."characterId" = :characterId AND uc."userId" = :userId', {userId: userId, characterId: characterId})
            .getOne();
        if(!character) {
            return Promise.resolve(null);
        }
        const result = await this.checkLodestoneProfileForString(characterId, "xiv-raid-hub-" + userId);
        if(result) {
            await getConnection()
                .createQueryBuilder()
                .update(UserCharacter)
                .set({isOwner: true})
                .where('"characterId" = :characterId AND "userId" = :userId', {userId: userId, characterId: characterId})
                .execute();
        }

        return Promise.resolve(result);
    }
    private static async checkLodestoneProfileForString(characterId: number, targetString: string): Promise<boolean> {
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
