import { IsIn, IsInt, Max, Min, validateOrReject } from 'class-validator';
import { BeforeInsert, BeforeUpdate, Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Exclude } from 'class-transformer';

import { RaidGroup } from './RaidGroup';
import { Alarm } from './Alarm';

@Index(['raidGroupId', 'utcHour'])
@Entity({name: 'weekly_raid_times'})
export class WeeklyRaidTime {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column()
    raidGroupId: number;

    @Exclude()
    @ManyToOne(() => RaidGroup, raidGroup => raidGroup.weeklyRaidTimes, {nullable: false, onDelete: 'CASCADE'})
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

    @IsInt()
    @Column()
    utcTimezoneOffset: number;

    @Exclude()
    @OneToMany(() => Alarm, alarm => alarm.weeklyRaidTime, {onDelete: 'CASCADE'})
    alarms: Alarm[];

    @BeforeInsert()
    @BeforeUpdate()
    private validate(): Promise<void> {
        return validateOrReject(this, {validationError: {target: false}});
    }
}
