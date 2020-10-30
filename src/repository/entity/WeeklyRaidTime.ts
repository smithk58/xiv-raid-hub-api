import { IsIn, IsInt, Max, Min, validateOrReject } from 'class-validator';
import { BeforeInsert, BeforeUpdate, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Exclude } from 'class-transformer';

import { RaidGroup } from './RaidGroup';

@Index(['raidGroupId', 'utcHour'])
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
    @Max(59)
    @IsIn([0, 15, 30, 45], {message: 'Minutes must be 0, 15, 30, or 45.'})
    @Column()
    utcMinute: number;

    @BeforeInsert()
    @BeforeUpdate()
    private validate(): Promise<void> {
        return validateOrReject(this, {validationError: {target: false}});
    }
}
