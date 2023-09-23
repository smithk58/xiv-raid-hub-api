import { Inject, Singleton } from 'typescript-ioc';
import { RaidGroupService } from './RaidGroupService';
import { UserService } from './UserService';
import { CharacterService } from './CharacterService';

@Singleton
export class DiscordUserService {
    @Inject private raidGroupService: RaidGroupService;
    @Inject private userService: UserService;
    @Inject private characterService: CharacterService;
    /**
     * Returns the raid times for a particular discord user.
     * @param discordUserId - The discord ID to search for raid times for.
     */
    public async getDiscordUsersWeeklyRaidTimes(discordUserId: string) {
        const user = await this.userService.getUserByDiscordId(discordUserId);
        if (!user) {
            return Promise.resolve(null);
        }
        // TODO weekly raid times
    }
    public async getDiscordUserCharacters(discordUserId: string) {
        const user = await this.userService.getUserByDiscordId(discordUserId);
        if (!user) {
            return Promise.resolve(null);
        }
        return this.characterService.getUserCharacters(user.id);
    }
}
