import { BeforeInsert, BeforeUpdate, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { IsEnum, IsIn, IsInt, Max, Min, validateOrReject } from 'class-validator';
import { Exclude } from 'class-transformer';

import { RaidGroup } from './RaidGroup';
import { User } from './User';

export enum AlarmType {
    USER = 'user',
    CHANNEL = 'channel'
}

@Unique('unique_alarm', ['raidGroupId', 'targetId', 'type', 'offsetHour'])
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

    @Column({length: 64}) // snowflake
    targetGuildId: string;

    @Column({length: 64}) // snowflake
    targetId: string;

    @Exclude()
    @Column({length: 100, nullable: true})
    targetName: string;

    @Column({length: 64, nullable: true})
    targetRoleId: string;

    @Column({length: 100, nullable: true})
    targetRoleName: string;

    @IsInt()
    @Min(0)
    @Max(24)
    @Column()
    offsetHour: number;

    @Index()
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
