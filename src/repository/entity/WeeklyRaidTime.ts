import { IsDateString, IsInt } from "class-validator";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { Exclude, Type } from "class-transformer";
import { RaidGroup } from "./RaidGroup";

@Entity({name: 'weekly_raid_times'})
export class WeeklyRaidTime {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    raidGroupId: number;

    @Exclude()
    @ManyToOne(type => RaidGroup, raidGroup => raidGroup.weeklyRaidTimes, {nullable: false})
    @JoinColumn({name: 'raidGroupId'})
    raidGroup: RaidGroup;

    @IsInt()
    @Column()
    weekMask: number;

    @IsDateString()
    @Column()
    startTime: string;
}
