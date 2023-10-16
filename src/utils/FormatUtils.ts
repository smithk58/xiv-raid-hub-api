import { RaidGroup } from '../repository/entity/RaidGroup';
import { WeeklyRaidTime } from '../repository/entity/WeeklyRaidTime';
import { Day, DaysOfWeek, DaysOfWeekByJsDay } from './DaysUtils';

export class FormatUtils {
    /**
     * Builds a map of day of week -> raid times, with raid groups and a unix timestamp attached to each raid time.
     * @param raidGroups -
     * @param raidTimes -
     */
    static formatRaidTimesForDiscordDisplay(raidGroups: RaidGroup[], raidTimes: WeeklyRaidTime[]) {
        const raidGroupMap = raidGroups.reduce((map: Record<string, RaidGroup>, group) => {
            map[group.id] = group;
            return map;
        }, {});
        // Create a new list of raid times with their unix timestamp
        const dRaidTimes: WeeklyRaidTime[] = [];
        for (const day of DaysOfWeek.values()) {
            for (const raidTime of raidTimes) {
                // eslint-disable-next-line no-bitwise
                if (raidTime.utcWeekMask & day.bit) {
                    const rTimeClone = {...raidTime} as WeeklyRaidTime;
                    rTimeClone.raidGroup = raidGroupMap[rTimeClone.raidGroupId];
                    rTimeClone.unixTimestamp = FormatUtils.getRaidTimeUnixTimestamp(rTimeClone, day);
                    dRaidTimes.push(rTimeClone);
                }
            }
        }
        return dRaidTimes;
    }

    /**
     * Creates a unix timestamp for a particular raid time for the current week. (i.e. a raid time on monday at 5pm will generate a unix
     * timestamp of the current weeks monday at 5pm, regardless of current day of week.
     * @param raidTime - The raid time to generate a unix timestamp for.
     * @param targetWeekDay - The day of the week to generate the timestamp for.
     */
    static getRaidTimeUnixTimestamp(raidTime: WeeklyRaidTime, targetWeekDay: Day) {
        const raidDateTime = new Date();
        // Adjust the raid time to the day/time of the current week that the raid time would happen on
        const currentWeekDay = DaysOfWeekByJsDay.get(raidDateTime.getUTCDay());
        const dayDiff = targetWeekDay.day - currentWeekDay.day;
        raidDateTime.setUTCHours(raidTime.utcHour, raidTime.utcMinute, 0);
        raidDateTime.setUTCDate(raidDateTime.getUTCDate() + dayDiff);
        // JS dates are milliseconds, unix timestamps are seconds, so we have to convert
        return Math.floor(raidDateTime.getTime() / 1000);
    }
}
