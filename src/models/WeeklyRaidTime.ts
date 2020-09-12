import { IsDateString, IsInt, IsString } from "class-validator";

export class WeeklyRaidTime {
    raidGroupId: string;
    @IsInt()
    weekMask: number;
    @IsDateString()
    startTime: string;
}
