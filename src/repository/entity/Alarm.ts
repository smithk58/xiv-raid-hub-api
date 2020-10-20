import { BeforeInsert, BeforeUpdate, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { IsEnum, IsIn, IsInt, Max, Min, validateOrReject } from 'class-validator';
import { Exclude } from 'class-transformer';

import { RaidGroup } from './RaidGroup';
import { User } from './User';

export enum AlarmType {
    USER = 'user',
    CHANNEL = 'channel'
}

@Unique('unique_alarm', ['raidGroupId', 'targetId', 'type', 'offsetHour', 'offsetMinute'])
@Entity({name: 'raid_group_alarms'})
export class Alarm {
    @PrimaryGeneratedColumn()
    id: number;

    @IsEnum(AlarmType)
    @Column({
        type: 'enum',
        enum: AlarmType
    })
    type: AlarmType;

    @Column({length: 129}) // 2x snowflakes + _ separator
    targetId: string;

    @Exclude()
    @Column({length: 100, nullable: true})
    targetName: string;

    @IsInt()
    @Min(0)
    @Max(23)
    @Column()
    offsetHour: number;

    @IsInt()
    @Min(0)
    @Max(59)
    @IsIn([0, 15, 30, 45], {message: 'Minutes must be 0, 15, 30, or 45.'})

    @Column()
    offsetMinute: number;

    @Column()
    isEnabled: boolean;

    @Exclude()
    @Column({name: 'ownerId'})
    ownerId: number;

    @Exclude()
    @ManyToOne(type => User, user => user.raidGroupAlarms, {nullable: false})
    @JoinColumn({name: 'ownerId'})
    owner: User;

    @Column({name: 'raidGroupId'})
    raidGroupId: number;

    @Exclude()
    @ManyToOne(type => RaidGroup, raidGroup => raidGroup.alarms, {nullable: false})
    @JoinColumn({name: 'raidGroupId'})
    raidGroup: RaidGroup;

    @BeforeInsert()
    @BeforeUpdate()
    private validate(): Promise<void> {
        return validateOrReject(this, {validationError: {target: false}});
    }
}
