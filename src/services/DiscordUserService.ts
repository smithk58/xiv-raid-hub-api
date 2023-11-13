import { Inject, Singleton } from 'typescript-ioc';
import { UserService } from './UserService';
import { CharacterService } from './CharacterService';
import { RaidTimeService } from './RaidTimeService';
import { RaidGroupService } from './RaidGroupService';
import { FormatUtils } from '../utils/FormatUtils';
import { AlarmService } from './AlarmService';

@Singleton
export class DiscordUserService {
    @Inject private userService: UserService;
    @Inject private raidTimeService: RaidTimeService;
    @Inject private raidGroupService: RaidGroupService;
    @Inject private characterService: CharacterService;
    @Inject private alarmService: AlarmService;
    /**
     * Returns the raid times for a particular discord user.
     * @param discordUserId - The discord ID to search for raid times for.
     */
    public async getDiscordUsersSchedule(discordUserId: string) {
        const user = await this.userService.getUserByDiscordId(discordUserId);
        if (!user) {
            return Promise.resolve(null);
        }
        const raidTimes = await this.raidTimeService.getAllWeeklyRaidTimes(user.id);
        const raidGroups = await this.raidGroupService.getRaidGroups(user.id);
        if (!raidTimes || !raidGroups) {
            return Promise.resolve([]);
        }
        return FormatUtils.formatRaidTimesForDiscordDisplay(raidGroups, raidTimes);
    }
    public async getDiscordUserCharacters(discordUserId: string) {
        const user = await this.userService.getUserByDiscordId(discordUserId);
        if (!user) {
            return Promise.resolve(null);
        }
        return this.characterService.getUserCharacters(user.id);
    }
    public async toggleDiscordUsersAlarms(discordUserId: string, isEnabled: boolean, channelId?: string) {
        const user = await this.userService.getUserByDiscordId(discordUserId);
        if (!user) {
            return Promise.resolve(null);
        }
        return this.alarmService.updateAlarmStatus(user.id, isEnabled, channelId);
    }
}
