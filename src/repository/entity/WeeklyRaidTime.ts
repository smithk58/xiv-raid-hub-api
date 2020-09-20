import { IsInt, Max, Min } from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';
import { Exclude } from 'class-transformer';

import { RaidGroup } from './RaidGroup';

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

    @IsInt()
    @Min(0)
    @Max(23)
    @Column()
    utcHour: number;

    @IsInt()
    @Min(0)
    @Max(60)
    @Column()
    utcMinute: number;
}
