import {
    BeforeInsert,
    BeforeUpdate,
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    Unique
} from 'typeorm';
import { IsEnum, IsInt, Max, Min, validateOrReject } from 'class-validator';
import { Exclude } from 'class-transformer';

import { RaidGroup } from './RaidGroup';
import { User } from './User';
import { Alarm } from './Alarm';

export enum AlarmType {
    USER = 'user',
    CHANNEL = 'channel'
}

@Unique('unique_alarm', ['raidGroupId', 'targetId', 'type', 'offsetHour'])
@Entity({name: 'raid_group_alarm_definitions'})
export class AlarmDefinition {
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

    @Exclude()
    @OneToMany(type => Alarm, alarm => alarm.alarmDefinition, {onDelete: 'CASCADE'})
    alarms: Alarm[];

    @BeforeInsert()
    @BeforeUpdate()
    private validate(): Promise<void> {
        return validateOrReject(this, {validationError: {target: false}});
    }
}
